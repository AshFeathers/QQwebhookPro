import * as ed25519 from '@noble/ed25519';
import { createHash } from 'crypto';

// 为 Node.js 环境配置哈希函数
ed25519.etc.sha512Sync = (...m) => createHash('sha512').update(Buffer.concat(m)).digest();

export interface SignatureRequest {
  event_ts: string;
  plain_token: string;
}

export interface SignatureResponse {
  plain_token: string;
  signature: string;
}

export class Ed25519Signer {
  /**
   * 生成Ed25519签名
   * @param botSecret 机器人密钥
   * @param eventTs 事件时间戳
   * @param plainToken 明文token
   * @returns 签名响应
   */
  static async generateSignature(
    botSecret: string, 
    eventTs: string, 
    plainToken: string
  ): Promise<SignatureResponse> {
    try {
      // 确保密钥长度至少32字节
      let normalizedSecret = botSecret;
      if (normalizedSecret.length < 32) {
        const repeatCount = Math.floor(32 / normalizedSecret.length) + 1;
        normalizedSecret = (normalizedSecret.repeat(repeatCount)).substring(0, 32);
      }

      // 生成私钥
      const secretBytes = new TextEncoder().encode(normalizedSecret);
      const privateKey = secretBytes.slice(0, 32); // Ed25519需要32字节私钥

      // 构建消息
      const message = `${eventTs}${plainToken}`;
      const messageBytes = new TextEncoder().encode(message);

      // 生成签名
      const signature = await ed25519.sign(messageBytes, privateKey);
      
      return {
        plain_token: plainToken,
        signature: Buffer.from(signature).toString('hex')
      };
    } catch (error) {
      console.error('签名生成失败:', error);
      throw new Error('签名生成失败');
    }
  }

  /**
   * 验证Ed25519签名
   * @param botSecret 机器人密钥
   * @param eventTs 事件时间戳
   * @param plainToken 明文token
   * @param signature 签名
   * @returns 验证结果
   */
  static async verifySignature(
    botSecret: string,
    eventTs: string,
    plainToken: string,
    signature: string
  ): Promise<boolean> {
    try {
      // 重新生成签名
      const expectedSignature = await this.generateSignature(botSecret, eventTs, plainToken);
      return expectedSignature.signature === signature;
    } catch (error) {
      console.error('签名验证失败:', error);
      return false;
    }
  }
}
