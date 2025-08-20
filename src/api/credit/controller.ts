import { RequestHandler, response } from "express";
import axios from "axios";

import configs from "../../configs";
import transactionGenerator from "../../utils/transaction_generator";

import IClientDoc from "../client/dto";
import Client from "../client/dal";

import AppError from "../../utils/app_error";

import { Bank } from "./dto";
import Transaction from "../transaction/dal";
import movePrizeToCredit from "./withdrawal_utils/prize_to_credit";
import moveCommissionToCredit from "./withdrawal_utils/commssion_to_credit";
import autJoin from "./credit_utils/auto_join/auto_join";
import CompetitionDAL from "../competition/dal";

const Stripe = require('stripe');
const stripe = Stripe('sk_test_51Qli3kHgCTFKnrtVaMurgmS6mm4Sr2PBkZJ3iWRU4jAktdR83lJlbwBloTIZyKtQCRKOyk0Gcblb8yqDI0WsDUX600IU5UQ7dW');

export const pay: RequestHandler = async (req, res, next) => {
  try {
    // Get "cid" of premier league
    const competetion = await CompetitionDAL.getBySlug("Premier_League");
    if (!competetion)
      return next(new AppError("Competition does not exist", 404));

    const cid = competetion.cid; // Competition Id

    // Get body
    const { amount, phone_number, auto_join, is_package, gameweeks } = <
      CreditRequest.ICreditTopup
    >req.value;

    // Get the user
    const user = <IClientDoc>req.user;
    if (!is_package) {
      if (user.credit + amount < 45) {
        const difference = 45 - user.credit;
        return next(
          new AppError(`You have to deposit at least ${difference}ETB`, 400)
        );
      }
    }

    // Generate Transaction reference number
    const tx_ref = transactionGenerator(user.first_name, user.last_name);
    let phoneNumberForCredit: string = phone_number || "";

    // If user has a phone number in profile and no phone_number provided, use profile phone
    if (!phone_number && user.phone_number) {
      phoneNumberForCredit = `0${user.phone_number.slice(4)}`;
    }

    // If no phone number available, return error
    if (!phoneNumberForCredit) {
      return next(new AppError("Phone number is required for credit transactions", 400));
    }

    // Return URL
    let return_url = `${configs.api_url}/credit/verify?tx_ref=${tx_ref}&client_id=${user._id}&amount=${amount}&auto_join=${auto_join}&cid=${cid}&is_package=${is_package}`;
    if (is_package)
      return_url = `${configs.api_url}/credit/verify?tx_ref=${tx_ref}&client_id=${user._id}&amount=${amount}&auto_join=${auto_join}&cid=${cid}&is_package=${is_package}&gameweeks=${gameweeks}`;

    // Generate chapa checkout
    axios
      .post(
        "https://api.chapa.co/v1/transaction/initialize",
        {
          amount: amount,
          currency: "ETB",
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: phoneNumberForCredit,
          tx_ref: tx_ref,
          "customization[title]": "Tactix",
          "customization[logo]": "",
          return_url,
        },
        {
          headers: {
            Authorization: `Bearer ${configs.chapa.secret_key}`,
          },
        }
      )
      .then((response) => {
        res.status(200).json({
          status: "SUCCESS",
          tx_ref,
          checkout_url: response.data.data.checkout_url,
        });
      })
      .catch((err) => {
        let message = "Unable to generate checkout URL";
        if (configs.env === "development") {
          message = err.response.data.message;
        }
        res.status(400).json({
          status: "FAILED",
          message,
        });
      });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment: RequestHandler = async (req, res, next) => {
  try {
    // Get query
    const queryStr = JSON.stringify(req.query).replace(/amp;/g, "");
    const { tx_ref, client_id, amount, auto_join, cid, is_package, gameweeks } =
      JSON.parse(queryStr);

    // Check if all required fields exists
    if (!tx_ref || !client_id || !amount || !auto_join || !is_package)
      return next(
        new AppError(
          "Transaction number, Client ID, Amount, Auto join flag, and Is Package flag are required. Please provide all of them.",
          400
        )
      );

    // Check if there is a number of gameweeks when the is package flag is true
    if (is_package === "true") {
      if (!gameweeks)
        return next(new AppError("Number of gameweeks is required", 400));
    }

    // Verify payment
    axios
      .get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
        headers: {
          Authorization: `Bearer ${configs.chapa.secret_key}`,
        },
      })
      .then(async (response) => {
        if (response.data.status === "success") {
          // Get client
          const client = await Client.getClientById(client_id);
          if (!client)
            return next(
              new AppError(
                "Client does not exist. Unable to verify the payment",
                400
              )
            );

          if (is_package !== "true") {
            // Update credit
            const latestCredit = client.credit + parseInt(amount);
            await Client.updateClientCredit({
              id: client_id as string,
              amount: latestCredit,
            });

            // Transaction History
            await Transaction.createTransaction({
              transactionType: "Deposit",
              amount,
              client_id,
            });
          } else {
            // Update gameweek package
            const latestGameweekPackage =
              client.gameweek_package + parseInt(gameweeks);
            await Client.updateGameweekPackage({
              id: client_id as string,
              gameweeks: latestGameweekPackage,
            });

            // Transaction History
            await Transaction.createTransaction({
              transactionType: "Package",
              amount,
              client_id,
              gameweek_package: parseInt(gameweeks),
            });
          }

          // Auto join the user to the current active game week
          if (auto_join === "true") {
            await autJoin(client_id, cid);
          }

          // Redirect
          res.redirect(`${configs.api_url}/credit/success`);

          // Respond
          // res.status(200).json({
          //   status: "SUCCESS",
          //   message: "Payment successfully verified",
          // });
        } else {
          console.log(response.data);
          res.redirect(`${configs.api_url}/credit/error`);
          // res.status(400).json({
          //   status: "FAILED",
          //   message: "Unable to verify your payment. Please try again",
          // });
        }
      })
      .catch((err) => {
        console.log(err);
        res.redirect(`${configs.api_url}/credit/error`);
        // let message = "Unable to verify your payment. Please try again";
        // if (configs.env === "development") {
        //   message = err.response.data.message;
        // }
        // res.status(400).json({
        //   status: "FAILED",
        //   message,
        // });
      });
  } catch (error) {
    next(error);
  }
};

// Success payment redirection
export const paymentSuccessRedirection: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    res.status(200).json({
      status: "SUCCESS",
      data: {
        payment: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Error redirection
export const paymentErrorRedirection: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    res.status(400).json({
      status: "FAIL",
      data: {
        payment: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Credit Withdrawal
export const withdrawal: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const {
      amount,
      bank_code,
      account_number,
      account_name,
      toBankOrCredit,
      fromPrizeOrCommission,
    } = <CreditRequest.IWithdrawal>req.value;

    // user
    const user = <IClientDoc>req.user;

    // Withdraw scenarios
    if (fromPrizeOrCommission === "Prize" && toBankOrCredit === "Credit") {
      // Update prize_balance and credit
      const client = await movePrizeToCredit(user, amount);

      // Transaction history
      await Transaction.createTransaction({
        transactionType: "Prize-Credit",
        amount,
        client_id: user.id,
      });

      // Send response
      return res.status(200).json({
        status: "SUCCESS",
        message: `${amount}ETB from your prize balance moved to your credit successfully`,
        data: client,
      });
    } else if (
      fromPrizeOrCommission === "Commission" &&
      toBankOrCredit === "Credit"
    ) {
      // Update commission_balance and credit
      const client = await moveCommissionToCredit(user, amount);

      // Transaction history
      await Transaction.createTransaction({
        transactionType: "Comission-Credit",
        amount,
        client_id: user.id,
      });

      // Send response
      return res.status(200).json({
        status: "SUCCESS",
        message: `${amount}ETB from your commission balance moved to your credit successfully`,
        data: { client },
      });
    } else {
      // Check client prize_balance and commission balance
      if (fromPrizeOrCommission === "Prize" && amount > user.prize_balance)
        return next(
          new AppError(
            `You can not withdraw more than ${user.prize_balance}ETB from your prize`,
            400
          )
        );

      if (
        fromPrizeOrCommission === "Commission" &&
        amount > user.commission_balance
      ) {
        return next(
          new AppError(
            `You can not withdraw more than ${user.commission_balance}ETB from your commission balance`,
            400
          )
        );
      }

      // Get all banks
      axios
        .get(`https://api.chapa.co/v1/banks`, {
          headers: {
            Authorization: `Bearer ${configs.chapa.secret_key}`,
          },
        })
        .then((response) => {
          // Check and fetch the bank
          const banks: [Bank] = response.data.data;
          const bank: Bank | undefined = banks.find(
            (bank: Bank) => bank.id === bank_code
          );
          if (!bank) return next(new AppError("Unable to find your bank", 400));

          // Check if the bank is active
          if (bank.active === 0)
            return next(new AppError("The bank is inactive", 400));

          // Perform withdrawal
          const withdrawalOpt = {
            account_name,
            account_number,
            amount,
            beneficiary_name: account_name,
            currency: "ETB",
            reference: transactionGenerator(user.first_name, user.last_name),
            bank_code,
          };
          axios
            .post(`https://api.chapa.co/v1/transfers`, withdrawalOpt, {
              headers: {
                Authorization: `Bearer ${configs.chapa.secret_key}`,
              },
            })
            .then((response) => {
              if (response.data.status === "success") {
                // Verify payment and update the credit
                axios
                  .get(
                    `https://api.chapa.co/v1/transfers/verify/${withdrawalOpt.reference}`,
                    {
                      headers: {
                        Authorization: `Bearer ${configs.chapa.secret_key}`,
                      },
                    }
                  )
                  .then(async (response) => {
                    if (response.data.status === "pending") {
                      if (fromPrizeOrCommission === "Commission") {
                        // Update commission_balance
                        const commission_balance =
                          user.commission_balance - amount;
                        await Client.updateCommissionAndCredit({
                          id: user.id,
                          commission_balance,
                          credit: user.credit,
                        });

                        // Transaction history
                        await Transaction.createTransaction({
                          transactionType: "Comission-Bank",
                          amount,
                          client_id: user.id,
                        });
                      } else if (fromPrizeOrCommission === "Prize") {
                        // Update prize_balance
                        const prize_balance = user.prize_balance - amount;
                        await Client.updatePrizeAndCredit({
                          id: user.id,
                          prize_balance,
                          credit: user.credit,
                        });

                        // Transaction history
                        await Transaction.createTransaction({
                          transactionType: "Prize-Bank",
                          amount,
                          client_id: user.id,
                        });
                      }

                      // Respond
                      res.status(200).json({
                        status: "SUCCESS",
                        message: "Withdrawal successfully done",
                        data: response.data.data,
                      });
                    } else {
                      return next(
                        new AppError("Unable to verify your withdrawal", 400)
                      );
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                    return next(new AppError(err.response.data.message, 400));
                  });
              } else {
                return next(new AppError("Unable to perform withdrawal", 400));
              }
            })
            .catch((err) => {
              return next(new AppError(err.response.data.message, 400));
            });
        })
        .catch((err) => {
          return next(new AppError(err.response.data.message, 400));
        });
    }
  } catch (error) {
    next(error);
  }
};

// Transfer Credit from admin
export const transferCreditForAdmin: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Get body
    const { amount, from, to } = <CreditRequest.ITransferCredit>req.value;

    // Check if from and to are similar
    if (from === to) {
      return next(
        new AppError("You can not transfer to your similar account", 400)
      );
    }

    // Get clients
    const clientFrom = await Client.getClientByEmail(from);
    if (!clientFrom)
      return next(
        new AppError(
          "There is no client with the specified email to send the credit",
          404
        )
      );

    const clientTo = await Client.getClientByEmail(to);
    if (!clientTo)
      return next(
        new AppError(
          "There is no client with the specified email to receive the credit",
          404
        )
      );

    // Check the amount of the transferrer
    if (clientFrom.credit < amount) {
      return next(new AppError("Insufficient amount", 400));
    }

    // Update
    const transfer = await Client.transferCredit({
      from: clientFrom,
      to: clientTo,
      amount,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Credit successfully transferred",
    });
  } catch (error) {
    next(error);
  }
};

// Transfer Credit
export const transferCredit: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { amount, to } = <CreditRequest.ITransferCredit>req.value;

    // Get clients
    const from = <IClientDoc>req.user;
    // Check if from and to are similar
    if (from.email === to) {
      return next(
        new AppError("You can not transfer to your own account", 400)
      );
    }

    const clientFrom = await Client.getClientByEmail(from.email);
    if (!clientFrom)
      return next(
        new AppError(
          "There is no client with the specified email to send the credit",
          404
        )
      );

    const clientTo = await Client.getClientByEmail(to);
    if (!clientTo)
      return next(
        new AppError(
          "There is no client with the specified email to receive the credit",
          404
        )
      );

    // Check the amount of the transferrer
    if (clientFrom.credit < amount) {
      return next(new AppError("Insufficient amount", 400));
    }

    // Update
    const transfer = await Client.transferCredit({
      from: clientFrom,
      to: clientTo,
      amount,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Credit successfully transferred",
    });
  } catch (error) {
    next(error);
  }
};

export const stripepayment: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { amount, currency } = <CreditRequest.IStripePayment>req.value;

    // Create a Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Accept card payments
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'WinSquad', // Replace with your product/service name
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: `${configs.api_url}/success`, // Redirect URL on success
      cancel_url: `${configs.api_url}/cancel`,   // Redirect URL on cancel
    });

    res.status(200).json({
      status: "SUCCESS",
      checkout_url: session.url,
    });
  } catch (error) {
    let message = "Unable to generate checkout URL";
    if (configs.env === "development") {
      message = String(error);
    }
    res.status(400).json({
      status: "FAILED",
      message,
    });
  }
};
