import mongoose from "mongoose";
import app from "./app.js";


const connectDB = async ()=> {
    try {
        await mongoose.connect(process.env.MONGO_URI)
    } catch (error) {
        console.log(`mongo db connection failed with error `, error);  
    }
}
app.listen(process.env.PORT,()=>{
    connectDB().then(()=>{
        console.log(`app is listening on port ${process.env.PORT}`);
    })
})