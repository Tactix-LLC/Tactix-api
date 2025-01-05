import Perk from "./dal";
import AppError from "../../utils/app_error";
import { RequestHandler } from "express";
import configs from "../../configs";
import axios from "axios";

// Create perk
export const createPerk: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <PerkRequest.ICreatePerkInput>req.value;

    //check if the value for week or yeark of perk is correct
    if (!["Y", "W"].includes(data.week_or_year)) {
      return next(
        new AppError(`Please insert the approprate value for week or year`, 400)
      );
    }

    // Check is there is an already existsing perk
    const existsingPerk = await Perk.getPerkByName(data.perk_name);

    if (existsingPerk) {
      return next(new AppError("Perk already exists", 400));
    }

    const perk = await Perk.createPerk(data);

    // Response
    res.status(201).json({
      status: "SUCCESS",
      message: "Perk created successfully",
      data: { perk },
    });
  } catch (error) {
    next(error);
  }
};

// Get perk by id
export const getPerk: RequestHandler = async (req, res, next) => {
    try {
      // Find perks by id
      const perk = await Perk.getPerk(req.params.id);
  
      // Response
      res.status(200).json({
        status: "SUCCESS",
        data: { perk },
      });
    } catch (error) {
      next(error);
    }
};


// Get perk
export const getPerks: RequestHandler = async (req, res, next) => {
    try {
      // get all perks that are active
      const perks = await Perk.getPerks();
  
      // Response
      res.status(200).json({
        status: "SUCCESS",
        results: perks.length,
        data: { perks },
      });
    } catch (error) {
      next(error);
    }
};


// Update a perk
export const updatePerk: RequestHandler = async (req, res, next) => {
    try {
      const data = <PerkRequest.IUpdatePerkInput> req.value;
      const id = req.params.id;

       //check if the value for week or yeark of perk is correct
       if(data.week_or_year)
            if (!["Y", "W"].includes(data.week_or_year)) {
                return next(
                new AppError(`Please insert the approprate value for week or year`, 400)
                );
            }

      //update a perk
      const perks = await Perk.updatePerk(id, data);
  
      // Response
      res.status(200).json({
        status: "SUCCESS",
        data: { perks },
      });
    } catch (error) {
      next(error);
    }
};


// Update a perk status
export const updatePerkStatus: RequestHandler = async (req, res, next) => {
    try {
      const data = <PerkRequest.IUpdatePerkStatusInput> req.value;
      const id = req.params.id;
    
      const existingPerk = await Perk.getPerk(id);

      if(!existingPerk){
        return next(new AppError("Perk does not exist", 404));
      }

      //update a perk
      const perks = await Perk.updatePerkStatus(id, data);
  
      // Response
      res.status(200).json({
        status: "SUCCESS",
        data: { perks },
      });
    } catch (error) {
      next(error);
    }
};


// delete all perks
export const deleteAllPerks: RequestHandler = async (req, res, next) => {
    try {
      const {deleteKey} = <PerkRequest.IDeleteAllPerksDeleteLey> req.value;

      if(deleteKey !== configs.delete_key){
        return next(new AppError("please provide the correct API key,", 400));
      }

      //delete all perks
     await Perk.deleteAllPerks();
  
      // Response
      res.status(200).json({
        status: "SUCCESS",
        message: "All perks are deleted successfuly.",
      });
    } catch (error) {
      next(error);
    }
};
