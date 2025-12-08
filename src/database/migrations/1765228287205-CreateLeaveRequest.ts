import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeaveRequest1765228287205 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`leave_requests\` (
                \`id\` varchar(36) NOT NULL, 
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
                \`employeeId\` varchar(255) NOT NULL, 
                \`startDate\` date NOT NULL, 
                \`endDate\` date NOT NULL, 
                \`status\` enum ('PENDING', 'APPROVED', 'REJECTED', 'PENDING_APPROVAL') NOT NULL DEFAULT 'PENDING', 
                \`processedAt\` timestamp NULL, 
                INDEX \`IDX_leave_requests_employeeId\` (\`employeeId\`), 
                INDEX \`IDX_leave_requests_status\` (\`status\`), 
                INDEX \`IDX_leave_requests_dates\` (\`startDate\`, \`endDate\`), 
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB`,
        );
        await queryRunner.query(
            `ALTER TABLE \`leave_requests\` ADD CONSTRAINT \`FK_leave_requests_employeeId\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leave_requests\` DROP FOREIGN KEY \`FK_leave_requests_employeeId\``);
        await queryRunner.query(`DROP INDEX \`IDX_leave_requests_dates\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_leave_requests_status\` ON \`leave_requests\``);
        await queryRunner.query(`DROP INDEX \`IDX_leave_requests_employeeId\` ON \`leave_requests\``);
        await queryRunner.query(`DROP TABLE \`leave_requests\``);
    }

}
