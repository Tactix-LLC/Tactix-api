import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";

// CSV File creator for loche clients' phone number
const csvCreator = () => {
  // Path
  const filePath = path.join(process.cwd(), "public/data/data.csv");

  // Read the file
  const phoneNumberData = fs.createReadStream(filePath).pipe(csvParser());

  // Array of client phone number
  const arrPhoneNumbers: any[] = [];

  phoneNumberData.on("data", (data) => {
    arrPhoneNumbers.push(data);
  });

  phoneNumberData.on("end", () => {
    let lastIndex = 1000;
    let data = [];
    for (let i = 1; i <= arrPhoneNumbers.length; i++) {
      // First index
      let firstIndex = i;

      data.push(arrPhoneNumbers[i]);

      // Check if first index is greater than last index
      if (firstIndex === lastIndex) {
        lastIndex = firstIndex + 1000;

        // Create file
        // Define file path
        const filePath = path.join(
          process.cwd(),
          `public/data/phone_number${firstIndex}.csv`
        );

        const csvWriter = createObjectCsvWriter({
          path: filePath,
          header: [{ id: "Phone Number", title: "Phone Number" }],
        });

        csvWriter
          .writeRecords(data)
          .then(() => {
            console.log("Writen successfully");
          })
          .catch((error) => {
            console.log(error);
            console.log("Error has occured");
          });

        data = [];
      }
    }
  });
};

csvCreator();
