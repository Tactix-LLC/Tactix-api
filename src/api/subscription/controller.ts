import { RequestHandler } from "express";
import axios from "axios";
import { google } from "googleapis";
import configs from "../../configs";
import Client from "../client/dal";
import ClientModel from "../client/model";
import AppError from "../../utils/app_error";
import IClientDoc from "../client/dto";
// Verify Receipt
export const verifyReceipt: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const { receipt, platform, productId } = req.body;

    if (!receipt || !platform || !productId) {
      return next(
        new AppError("Receipt, platform, and productId are required", 400)
      );
    }

    if (platform === "ios") {
      const APPLE_VERIFY_URL = "https://buy.itunes.apple.com/verifyReceipt";
      const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
      const sharedSecret = configs.apple.sharedSecret;

      if (!sharedSecret) {
        return next(
          new AppError("Apple shared secret is not configured", 500)
        );
      }

      const verifyAppleReceipt = async (url: string) => {
        return axios.post(url, {
          "receipt-data": receipt,
          password: sharedSecret,
          "exclude-old-transactions": true,
        });
      };

      // Try production first
      let response = await verifyAppleReceipt(APPLE_VERIFY_URL);

      // If status is 21007, it means it's a sandbox receipt sent to production URL
      if (response.data.status === 21007) {
        response = await verifyAppleReceipt(APPLE_SANDBOX_URL);
      }

      if (response.data.status !== 0) {
        return next(
          new AppError(`Invalid receipt. Status: ${response.data.status}`, 400)
        );
      }

      // Get the latest receipt info
      const latestReceiptInfo = response.data.latest_receipt_info;
      if (!latestReceiptInfo || latestReceiptInfo.length === 0) {
        return next(new AppError("No receipt info found", 400));
      }

      // Find the transaction for the specific product ID
      // Sort by purchase date descending to get the latest one
      const latestTransaction = latestReceiptInfo
        .filter((info: any) => info.product_id === productId)
        .sort((a: any, b: any) => parseInt(b.purchase_date_ms) - parseInt(a.purchase_date_ms))[0];

      if (!latestTransaction) {
        return next(new AppError("Subscription not found in receipt", 400));
      }

      const expiresAt = new Date(parseInt(latestTransaction.expires_date_ms));

      // Update user subscription
      await Client.updateSubscription({
        id: user._id,
        subscription_status: "active",
        subscription_plan: productId.includes("yearly") ? "yearly" : "monthly",
        subscription_expires_at: expiresAt,
      });

      res.status(200).json({
        status: "SUCCESS",
        message: "Subscription verified successfully",
        data: {
          subscription_status: "active",
          subscription_expires_at: expiresAt,
        },
      });
    } else {
      // Android verification
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: configs.google.client_email,
          private_key: configs.google.private_key,
        },
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      });

      const androidPublisher = google.androidpublisher({
        version: "v3",
        auth,
      });

      // receipt in Android is usually the purchaseToken
      // We also need the packageName (bundle ID)
      const packageName = "app.jointactix.fantasy"; 

      try {
        const response = await androidPublisher.purchases.subscriptions.get({
          packageName,
          subscriptionId: productId,
          token: receipt,
        });

        if (!response.data.expiryTimeMillis) {
          return next(new AppError("Invalid subscription data", 400));
        }

        const expiresAt = new Date(parseInt(response.data.expiryTimeMillis));

        // Update user subscription
        await Client.updateSubscription({
          id: user._id,
          subscription_status: "active",
          subscription_plan: productId.includes("yearly") ? "yearly" : "monthly",
          subscription_expires_at: expiresAt,
        });

        res.status(200).json({
          status: "SUCCESS",
          message: "Subscription verified successfully",
          data: {
            subscription_status: "active",
            subscription_expires_at: expiresAt,
          },
        });
      } catch (err) {
        console.error("Google Play Verification Error:", err);
        return next(new AppError("Failed to verify Android subscription", 400));
      }
    }
  } catch (error) {
    next(error);
  }
};

// RevenueCat Webhook Handler
// This handles subscription events from RevenueCat (purchases, renewals, cancellations, etc.)
export const revenueCatWebhook: RequestHandler = async (req, res, next) => {
  try {
    const webhookSecret = configs.revenuecat.webhookSecret;
    
    if (!webhookSecret) {
      console.error("RevenueCat webhook secret not configured");
      return res.status(500).json({
        status: "FAIL",
        message: "Webhook secret not configured",
      });
    }

    // Verify webhook signature (RevenueCat sends Authorization header)
    const authHeader = req.headers.authorization;
    
    // Log for debugging
    console.log("🔐 Webhook Authorization Check:");
    console.log("   Received header:", authHeader ? `${authHeader.substring(0, 20)}...` : "missing");
    console.log("   Expected secret:", webhookSecret ? `${webhookSecret.substring(0, 20)}...` : "missing");
    
    // RevenueCat sends the webhook secret directly in the Authorization header
    // Handle both "Bearer <secret>" and just "<secret>" formats
    // Also trim whitespace in case there's any
    const receivedSecret = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7).trim() 
      : authHeader?.trim();
    
    const expectedSecret = webhookSecret?.trim();
    
    if (!receivedSecret || !expectedSecret || receivedSecret !== expectedSecret) {
      console.error("❌ Invalid webhook signature");
      console.error("   Received:", receivedSecret || "null");
      console.error("   Expected:", expectedSecret || "null");
      console.error("   Match:", receivedSecret === expectedSecret);
      console.error("   All headers:", Object.keys(req.headers));
      return res.status(401).json({
        status: "FAIL",
        message: "Unauthorized",
      });
    }
    
    console.log("✅ Webhook signature verified successfully");

    const event = req.body;
    
    // RevenueCat webhook structure can vary - check both locations for event type
    const eventType = event.type || event.event?.type || event.event_type;
    console.log("📨 RevenueCat Webhook Event Type:", eventType);
    console.log("📦 Full event body:", JSON.stringify(event, null, 2));
    
    // Get the event data - it might be nested in event.event or directly in event
    const eventData = event.event || event;
    console.log("📦 Event data:", JSON.stringify(eventData, null, 2));

    // Get user ID from RevenueCat event
    // RevenueCat sends app_user_id which should be your user's database ID
    const appUserId = eventData?.app_user_id || eventData?.appUserID || event.app_user_id || event.appUserID;
    
    if (!appUserId) {
      console.error("No app_user_id found in webhook event");
      return res.status(400).json({
        status: "FAIL",
        message: "Missing app_user_id",
      });
    }

    // Find user by ID (assuming app_user_id is MongoDB ObjectId)
    const user = await Client.getClientById(appUserId);
    if (!user) {
      console.error(`User not found: ${appUserId}`);
      return res.status(404).json({
        status: "FAIL",
        message: "User not found",
      });
    }

    // Handle different event types
    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "BILLING_ISSUE": {
        // Subscription is active
        // RevenueCat webhook events can have different structures
        // Try multiple formats to extract subscription data
        
        let expiresAt: Date | null = null;
        let productId: string | null = null;
        let plan: string = "monthly";
        
        // Format 1: New webhook format (eventData has direct fields)
        if (eventData?.expiration_at_ms) {
          expiresAt = new Date(eventData.expiration_at_ms);
          productId = eventData.product_id;
          console.log("📦 Using new webhook format (expiration_at_ms)");
        }
        // Format 2: Old format with entitlements object
        else if (eventData?.entitlements || eventData?.active_entitlements) {
          const entitlements = eventData?.entitlements || {};
          const activeEntitlements = eventData?.active_entitlements || eventData?.activeEntitlements || {};
          
          // Try to find entitlement
          let premiumEntitlement = 
            entitlements["premium"] || 
            entitlements.premium ||
            entitlements["Tactix LLC Pro"] ||
            entitlements["tactix_llc_pro"] ||
            activeEntitlements["premium"] ||
            activeEntitlements.premium ||
            activeEntitlements["Tactix LLC Pro"] ||
            activeEntitlements["tactix_llc_pro"];
          
          // If not found, get the first active entitlement
          if (!premiumEntitlement) {
            const entitlementKeys = Object.keys(entitlements).length > 0 
              ? Object.keys(entitlements)
              : Object.keys(activeEntitlements);
            
            if (entitlementKeys.length > 0) {
              premiumEntitlement = entitlements[entitlementKeys[0]] || activeEntitlements[entitlementKeys[0]];
              console.log(`ℹ️ Using first available entitlement: ${entitlementKeys[0]}`);
            }
          }
          
          if (premiumEntitlement) {
            if (premiumEntitlement.expires_date) {
              expiresAt = new Date(premiumEntitlement.expires_date);
            } else if (premiumEntitlement.expiration_at_ms) {
              expiresAt = new Date(premiumEntitlement.expiration_at_ms);
            }
            productId = premiumEntitlement.product_identifier || premiumEntitlement.productIdentifier;
            console.log("📦 Using entitlements object format");
          }
        }
        // Format 3: Check entitlement_ids array (new format)
        else if (eventData?.entitlement_ids && Array.isArray(eventData.entitlement_ids) && eventData.entitlement_ids.length > 0) {
          // If we have entitlement_ids but no expiration, try to get from other fields
          if (eventData.expiration_at_ms) {
            expiresAt = new Date(eventData.expiration_at_ms);
            productId = eventData.product_id;
            console.log("📦 Using entitlement_ids array format with expiration_at_ms");
          }
        }
        
        // Determine plan from product_id
        // Get product_id if we don't have it yet
        if (!productId && eventData?.product_id) {
          productId = eventData.product_id;
        }
        
        // Determine plan type from product_id
        if (productId) {
          plan = productId.includes("yearly") || productId.includes("annual") ? "yearly" : "monthly";
        } else {
          // Default to monthly if we can't determine from product_id
          plan = "monthly";
          console.warn(`⚠️ Could not determine product_id, defaulting to monthly plan`);
        }
        
        // If we don't have expiration date, try to calculate from period type
        if (!expiresAt) {
          // Try to get period type and calculate expiration
          const periodType = eventData?.period_type;
          const purchasedAtMs = eventData?.purchased_at_ms;
          
          if (purchasedAtMs) {
            const purchasedAt = new Date(purchasedAtMs);
            if (plan === "yearly") {
              // Add 1 year
              expiresAt = new Date(purchasedAt);
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              console.log(`📅 Calculated expiration date: 1 year from purchase date`);
            } else {
              // Add 1 month (default to monthly)
              expiresAt = new Date(purchasedAt);
              expiresAt.setMonth(expiresAt.getMonth() + 1);
              console.log(`📅 Calculated expiration date: 1 month from purchase date`);
            }
          } else {
            // Last resort: set expiration to 1 month from now
            expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + (plan === "yearly" ? 12 : 1));
            console.warn(`⚠️ Could not extract expiration date, using default: ${expiresAt.toISOString()}`);
          }
        }
        
        // Always update subscription (we now have expiresAt)
        try {
          const updatedClient = await Client.updateSubscription({
            id: user._id,
            subscription_status: "active",
            subscription_plan: plan,
            subscription_expires_at: expiresAt!,
          });

          if (updatedClient) {
          console.log(`✅ Subscription updated for user ${appUserId}: ${plan} until ${expiresAt!.toISOString()}`);
          console.log(`   Product: ${productId || 'unknown'}`);
          console.log(`   Event type: ${eventType}`);
            console.log(`   Updated client:`, {
              id: updatedClient._id,
              status: (updatedClient as any).subscription_status,
              plan: (updatedClient as any).subscription_plan,
              expiresAt: (updatedClient as any).subscription_expires_at
            });
          } else {
            console.error(`❌ Failed to update subscription - updateSubscription returned null for user ${appUserId}`);
          }
        } catch (updateError) {
          console.error(`❌ Error updating subscription in database:`, updateError);
          throw updateError; // Re-throw to be caught by outer catch
        }
        break;
      }

      case "CANCELLATION":
      case "EXPIRATION":
        // Subscription cancelled or expired
        // Update directly using mongoose to allow null values
        await ClientModel.findByIdAndUpdate(
          user._id,
          {
            subscription_status: "inactive",
            subscription_plan: null,
            subscription_expires_at: null,
          },
          { runValidators: true, new: true }
        );

        console.log(`❌ Subscription cancelled/expired for user ${appUserId}`);
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event type: ${eventType}`);
        console.log(`   Available event data keys:`, Object.keys(eventData || {}));
        // Try to handle as RENEWAL/INITIAL_PURCHASE even if type is undefined but we have subscription data
        if (eventData?.expiration_at_ms || eventData?.product_id) {
          console.log(`⚠️ Event type is undefined but has subscription data - attempting to process as RENEWAL`);
          // Recursively call the RENEWAL handler logic
          // For now, just log - we'll handle this in the next iteration
        }
    }

    // Verify the update was successful by fetching the user again
    try {
      const verifyUser = await Client.getClientById(appUserId);
      if (verifyUser) {
        const userData = verifyUser as any;
        console.log(`✅ Verification - User subscription status: ${userData.subscription_status || 'not set'}`);
        console.log(`   Plan: ${userData.subscription_plan || 'null'}`);
        console.log(`   Expires: ${userData.subscription_expires_at?.toISOString() || 'null'}`);
      }
    } catch (verifyError) {
      console.error(`⚠️ Could not verify update:`, verifyError);
    }

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({
      status: "SUCCESS",
      message: "Webhook processed",
      data: {
        userId: appUserId,
        eventType: eventType,
        updated: true
      }
    });
  } catch (error) {
    console.error("❌ RevenueCat webhook error:", error);
    console.error("   Error details:", error instanceof Error ? error.message : String(error));
    console.error("   Stack:", error instanceof Error ? error.stack : 'No stack trace');
    // Still return 200 to prevent RevenueCat from retrying indefinitely
    res.status(200).json({
      status: "FAIL",
      message: "Webhook processing error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
