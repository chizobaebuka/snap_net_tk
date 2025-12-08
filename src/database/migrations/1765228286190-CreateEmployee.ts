import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmployee1765228286190 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`employees\` (
                \`id\` varchar(36) NOT NULL, 
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
                \`name\` varchar(255) NOT NULL, 
                \`email\` varchar(255) NOT NULL, 
                \`role\` enum ('ADMIN', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
                \`password\` varchar(255) NULL,
                \`departmentId\` varchar(255) NOT NULL, 
                INDEX \`IDX_employees_departmentId\` (\`departmentId\`), 
                UNIQUE INDEX \`UQ_employees_email\` (\`email\`), 
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`employees\` ADD CONSTRAINT \`FK_employees_departmentId\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`employees\` DROP FOREIGN KEY \`FK_employees_departmentId\``);
        await queryRunner.query(`DROP INDEX \`UQ_employees_email\` ON \`employees\``);
        await queryRunner.query(`DROP INDEX \`IDX_employees_departmentId\` ON \`employees\``);
        await queryRunner.query(`DROP TABLE \`employees\``);
    }

}
