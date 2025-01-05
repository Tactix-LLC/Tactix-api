import { RequestHandler } from "express";
import configs from "../../configs";

//Data Access Layer
import Faq from "./dal";

//Error handler
import AppError from "../../utils/app_error";

//create FAQ
export const createFaq: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { title, content } = <FaqRequest.ICreateFaqInput>req.value;

    // create FAQ
    const faq = await Faq.createFaq({ title, content });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "New faq account is successfully created",
      data: {
        faq,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get All FAQs
export const getFaqs: RequestHandler = async (req, res, next) => {
  try {
    // create FAQ
    const faqs = await Faq.getFaqs();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: faqs.length,
      data: {
        faqs,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get All FAQs including drafts
export const getEveryFaq: RequestHandler = async (req, res, next) => {
  try {
    // get every FAQ
    const faqs = await Faq.getEveryFaq();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: faqs.length,
      data: {
        faqs,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get a single FAQ
export const getFaq: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // get one FAQ
    const faq = await Faq.getFaqById(id);

    if (!faq) return next(new AppError("No FAQ Found!", 400));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        faq,
      },
    });
  } catch (error) {
    next(error);
  }
};

//change published FAQ status
export const changePublishedStatus: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { status } = <FaqRequest.IUpdateFaqByStatusInput>req.value;

    // update FAQ status
    const faq = await Faq.updatePublishedStatus({ id: req.params.id, status });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        faq,
      },
    });
  } catch (error) {
    next(error);
  }
};

//update single FAQ
export const updateSingleFaq: RequestHandler = async (req, res, next) => {
  try {
    const data = <FaqRequest.IUpdateFaqInput>req.value;

    // create FAQ
    const faq = await Faq.updateFaq({ id: req.params.id, ...data });
    if (!faq) return next(new AppError("No FAQ Found!", 400));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        faq,
      },
    });
  } catch (error) {
    next(error);
  }
};

//delete single FAQ
export const deleteFaq: RequestHandler = async (req, res, next) => {
  try {
    // delete FAQ
    const faq = await Faq.deleteSingleFaq(req.params.id);
    if (!faq) return next(new AppError("No FAQ Found!", 400));

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "FAQ Deleted Successfuly",
    });
  } catch (error) {
    next(error);
  }
};


//delete All FAQs
export const deleteFaqs: RequestHandler = async (req, res, next) => {
  try {
    // Get delete key
    const { delete_key } = <FaqRequest.IDeleteAllFaqsInput>req.value;

    // Check the delete key
    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    // delete FAQ
    await Faq.deleteFaqs();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "FAQs Deleted Successfuly",
    });
  } catch (error) {
    next(error);
  }
};
