const mongoose = require("mongoose")

const initdata = require("./data.js");

const listing = require("../models/listing.js")

const mongoose_url = "mongodb://127.0.0.1:27017/vanderlust";

async function main() {
    mongoose.connect(mongoose_url);
}

main()
.then(
    (res)=>{
        console.log("Connected succesfully")
    }
)
.catch(
    (err)=>{
        console.log(err)
    }
)

const initDB = async()=>{
    await listing.deleteMany({});
    console.log(initdata);
    let newData = initdata.map((obj)=>({
       ...obj,
       owner : "68aebf5349645107b1b3a932"
    }))
    await listing.insertMany(newData);
    console.log("data is initialized");
}

initDB();