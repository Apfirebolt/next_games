import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    img: {
      type: String,
      default: "",
      trim: true,
    },
    console: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    genre: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    publisher: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    developer: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    critic_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
      index: true,
    },
    total_sales: {
      type: Number,
      default: 0,
      min: 0,
    },
    release_date: {
      type: String,
      default: "",
      trim: true,
    },

    similar_games: [
    {
      id: { type: Number, required: true },
      score: { type: Number, required: true },
    },
  ],
  },
  
  {
    timestamps: true,
  }
);

// Compound index for recommendation engine candidate filtering
gameSchema.index({ genre: 1, console: 1 });
gameSchema.index({ developer: 1, publisher: 1 });

// Full-text search index for catalog search queries
gameSchema.index({
  title: "text",
  developer: "text",
  publisher: "text",
  genre: "text",
});

const Game = mongoose.models.Game || mongoose.model("Game", gameSchema);

export default Game;