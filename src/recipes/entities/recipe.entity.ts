import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'json' }) // Store as JSON string
  ingredients: { name: string; quantity: number; unit: string }[];

  @Column({ type: 'json' }) // Store as JSON string
  instructions: string[];

  @Column({ nullable: true })
  prepTime?: number;

  @Column({ nullable: true })
  cookTime?: number;

  @Column({ nullable: true })
  servings?: number;
}
