import jwt from 'jsonwebtoken';
import { User, checkUser } from '../db/schemas/user';
import userModel, { UserModel } from '../db/models/userModel';
import { Request, Response, NextFunction } from 'express';

require('dotenv').config();

const refreshSecretKey: string | Buffer = process.env.REFRESH_SECRET || '';
const accessSecret: string | Buffer = process.env.ACCESS_SECRET || '';
const authKey: string | Buffer = process.env.AUTH_KEY || '';
const algorithm: any = process.env.JWT_ALG;
const expiresIn: string | undefined = process.env.JWT_EXP;

const option = { algorithm, expiresIn };

const setUserToken = (user: any, isOnlyAccess: Number, res: Response) => {
  const accessPayload = {
    nickName: user.nickName,
    email: user.email,
    profileImage: user.profileImage,
    isAdmin: user.adminNumber,
    isTempPassword: user.isTempPassword,
  };

  const accessToken = jwt.sign(accessPayload, accessSecret, option);
  console.log(`accessToken: ${accessToken}`);

  // Refresh Token을 httpOnly 쿠키로 설정
  if (!isOnlyAccess) {
    const refreshPayload = { email: user.email };
    const refreshOptions = { algorithm, expiresIn: '7d' };
    const refreshToken = jwt.sign(
      refreshPayload,
      refreshSecretKey,
      refreshOptions,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // 클라이언트 측 JavaScript에서 쿠키를 접근할 수 없게 함
      // secure: process.env.NODE_ENV === 'production', // 프로덕션 환경에서는 HTTPS를 통해서만 전송
      secure: false, // 개발 환경에서는 false로 테스트
      maxAge: 7 * 24 * 60 * 60 * 1000, // 쿠키 만료 시간 (7일)
    });

    User.updateOne(
      { email: refreshPayload.email },
      { refreshToken: refreshToken },
    )
      .then((res) => {
        console.log('utils/jwt => res : ', res);
      })
      .catch((err) => {
        console.log('fail : ', err);
      });
  }

  return res.json({
    message: '로그인 성공',
    accessToken,
  });
};

const setAuthCodeToken = (authCode: String) => {
  const payload = { authCode: authCode };
  const options = { algorithm, expiresIn: '1h' }; // 토큰 만료시간 (1시간)
  return jwt.sign(payload, authKey, options);
};

export { setUserToken, setAuthCodeToken };
