import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Category name is required"],
      minlength: [2, "too short category name"],
    },
    slug: {
      type: String,
      lowercase: true,
      required: [true, "Slug is required"],
      unique: true,
      default: function () {
        return slugify(this.name, { lower: true });
      },
    },
    image: {
      type: Object, //{path} //{secure_url , Public_id}
      required: [true, "image is required"]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user ID is required"],
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON : {virtuals: true}, //json res
    toObject: {virtuals: true} //log
  }
);

categorySchema.pre("save", function (next) {
  if (!this.isModified("name")) return next();
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;