import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "therapist", "admin"],
      default: "user",
    },

    profile_picture: {
      type: String,
      default: "",
    },

    refreshToken: {
      type: String,
      default: "",
    },

    resetPasswordToken: {
      type: String,
      default: "",
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      default: "",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hide sensitive fields
userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.refreshToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  delete user.verificationToken;

  return user;
};

const User = mongoose.model("User", userSchema);

export default User;