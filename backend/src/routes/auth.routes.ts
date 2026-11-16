import { Router } from "express";
import { adminLogin } from "../controllers/auth.controller";
import { loginRequestOtp, loginVerify, signupRequestOtp, signupVerify } from "../controllers/student-auth.controller";

export const authRouter = Router();

authRouter.post("/admin/login", adminLogin);

// Students sign up and log in with a mobile number and an OTP: first ask for the OTP, then verify it
authRouter.post("/student/signup/request-otp", signupRequestOtp);
authRouter.post("/student/signup/verify", signupVerify);
authRouter.post("/student/login/request-otp", loginRequestOtp);
authRouter.post("/student/login/verify", loginVerify);
