import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDepartment1765228285554 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`departments\` (
                \`id\` varchar(36) NOT NULL, 
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
                \`name\` varchar(255) NOT NULL, 
                UNIQUE INDEX \`UQ_departments_name\` (\`name\`), 
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`UQ_departments_name\` ON \`departments\``);
        await queryRunner.query(`DROP TABLE \`departments\``);
    }

}
