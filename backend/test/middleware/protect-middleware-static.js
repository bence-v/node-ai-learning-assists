import fs from 'fs';
import { expect } from 'chai';
import path from 'path';
import {fileURLToPath} from "url";
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Route Protection Security Audit', () => {
    const routesPath = path.join(__dirname, '../../routes');
    const routeFiles = fs.readdirSync(routesPath).filter(file => file.endsWith('.js'));

    routeFiles.forEach(file => {
        const filePath = path.join(routesPath, file);
        const content = fs.readFileSync(filePath, 'utf8');

        describe(`File: ${file}`, () => {
            if (file === 'authRoutes.js') {
                it('authRoutes should have unprotected login/register but protect other endpoints', () => {

                    const hasProtect = content.includes('protect');
                    const hasLogin = content.includes('login');
                    const hasRegister = content.includes('register');

                    expect(hasLogin).to.be.true;
                    expect(hasRegister).to.be.true;

                    const routeCount = (content.match(/\.(get|post|put|delete)\(/g) || []).length;
                    if (routeCount > 2) {
                        expect(content).to.include('protect');
                    }
                });
            } else {
                it(`should apply protect middleware to all routes in ${file}`, () => {
                    const usesProtectMiddleware = content.includes('protect');

                    const isGloballyApplied = content.includes('router.use(protect)');
                    const isLocallyApplied = content.match(/\.(get|post|put|delete)\(.*protect.*\)/);

                    expect(usesProtectMiddleware).to.be.true;
                    expect(isGloballyApplied || isLocallyApplied).to.be.true;
                });
            }
        });
    });

    after(async () => {
        await mongoose.connection.close();
    });
});