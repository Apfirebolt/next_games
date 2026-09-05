import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [120, "Review title cannot exceed 120 characters"],
      default: "",
    },
    content: {
      type: String,
      trim: true,
      default: "", // Stores raw Markdown string
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [10, "Rating cannot exceed 10"],
      default: null,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    gameId: {
      type: Number,
      required: [true, "Game ID is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    img: {
      type: String,
      default: "",
    },
    console: {
      type: String,
      trim: true,
      default: "",
    },
    genre: {
      type: String,
      trim: true,
      default: "",
    },
    publisher: {
      type: String,
      trim: true,
      default: "",
    },
    developer: {
      type: String,
      trim: true,
      default: "",
    },
    critic_score: {
      type: Number,
      default: 0,
    },
    total_sales: {
      type: Number,
      default: 0,
    },
    release_date: {
      type: String,
      default: "",
    },
    // added new review field
    review: {
      type: reviewSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Ensures a user cannot favorite the same game twice
favoriteSchema.index({ user: 1, gameId: 1 }, { unique: true });

const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);

export default Favorite;