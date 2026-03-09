const mongoose = require("mongoose");
const { Schema } = mongoose;

const ThemeSchema = new Schema(
  {
    type: { type: String, required: true, unique: true }, // e.g., 'navbar'
    colors: {
      color1: { type: String, required: false },
      color2: { type: String, required: false },
    },
    contact: {
      address: { type: String },
      phone: { type: String },
      email: { type: String },
      description: { type: String },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Theme", ThemeSchema);
