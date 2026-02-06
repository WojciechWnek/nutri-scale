import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JobStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'simple-enum',
    enum: JobStatus,
    default: JobStatus.PROCESSING,
  })
  status: JobStatus;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  ingredients: { name: string; quantity: number; unit: string }[];

  @Column({ type: 'json', nullable: true })
  instructions: string[];

  @Column({ nullable: true })
  prepTime?: number;

  @Column({ nullable: true })
  cookTime?: number;

  @Column({ nullable: true })
  servings?: number;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
