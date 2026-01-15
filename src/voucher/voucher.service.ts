import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from './voucher.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);

  constructor(
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Get voucher by ID
   */
  async getVoucher(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
      relations: ['user', 'reward'],
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }

    return voucher;
  }

  /**
   * Get voucher by code
   */
  async getVoucherByCode(code: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { voucher_code: code },
      relations: ['user', 'reward'],
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${code} not found`);
    }

    return voucher;
  }

  /**
   * Check if voucher is valid
   */
  async validateVoucher(voucherId: string): Promise<{ isValid: boolean; message: string }> {
    const voucher = await this.getVoucher(voucherId);

    // Check status
    if (voucher.status === 'used') {
      return { isValid: false, message: 'Voucher has already been used' };
    }

    if (voucher.status === 'expired') {
      return { isValid: false, message: 'Voucher has expired' };
    }

    // Check expiry date
    if (voucher.expiry_date && new Date() > voucher.expiry_date) {
      voucher.status = 'expired';
      await this.voucherRepository.save(voucher);
      return { isValid: false, message: 'Voucher has expired' };
    }

    return { isValid: true, message: 'Voucher is valid' };
  }

  /**
   * Get user's unused vouchers
   */
  async getUserUnusedVouchers(userId: string): Promise<Voucher[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.voucherRepository.find({
      where: { user: { id: userId }, status: 'unused' },
      relations: ['reward'],
      order: { redeem_date: 'DESC' },
    });
  }

  /**
   * Get all user vouchers
   */
  async getUserAllVouchers(userId: string): Promise<Voucher[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.voucherRepository.find({
      where: { user: { id: userId } },
      relations: ['reward'],
      order: { redeem_date: 'DESC' },
    });
  }

  /**
   * Count vouchers by status
   */
  async getVoucherCountByStatus(userId: string, status: string): Promise<number> {
    return this.voucherRepository.count({
      where: { user: { id: userId }, status },
    });
  }

  /**
   * Verify voucher code at partner location
   */
  async verifyVoucherCode(code: string): Promise<Voucher> {
    const voucher = await this.getVoucherByCode(code);

    const validation = await this.validateVoucher(voucher.id);
    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    return voucher;
  }

  /**
   * Mark voucher as used
   */
  async markVoucherAsUsed(voucherId: string): Promise<Voucher> {
    const voucher = await this.getVoucher(voucherId);

    if (voucher.status !== 'unused') {
      throw new BadRequestException(`Voucher is already ${voucher.status}`);
    }

    voucher.status = 'used';
    voucher.used_date = new Date();

    const saved = await this.voucherRepository.save(voucher);
    this.logger.log(`Voucher ${voucherId} marked as used`);

    return saved;
  }

  /**
   * Expire voucher
   */
  async expireVoucher(voucherId: string): Promise<Voucher> {
    const voucher = await this.getVoucher(voucherId);

    if (voucher.status === 'used') {
      throw new BadRequestException('Cannot expire a used voucher');
    }

    voucher.status = 'expired';
    const saved = await this.voucherRepository.save(voucher);
    this.logger.log(`Voucher ${voucherId} expired`);

    return saved;
  }
}
