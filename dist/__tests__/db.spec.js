"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../src/main");
const mongoose = require("mongoose");
// @ts-expect-errors private variable
mongoose.Promise = global.Promise;
describe('Transaction using DB ', () => {
    mongoose.connection
        .once('open', () => {
        console.log('Mongo connected!');
    })
        .on('error', (err) => console.warn('Warning', err));
    let transaction;
    const personSchema = new mongoose.Schema({
        age: Number,
        name: String,
    });
    const carSchema = new mongoose.Schema({
        age: Number,
        name: String,
    });
    const Person = mongoose.model('Person', personSchema);
    const Car = mongoose.model('Car', carSchema);
    async function dropCollections() {
        await Person.deleteMany({});
        await Car.deleteMany({});
    }
    /**
     * connect to database
     */
    beforeAll(async () => {
        await mongoose.connect(`mongodb://127.0.0.1:27017/mongoose-transactions`);
    });
    /**
     * drop database collections
     * create new Transaction using database storage
     */
    beforeEach(async () => {
        await dropCollections();
        const useDB = true;
        transaction = new main_1.default(useDB);
    });
    /**
     * drop database collections
     * close database connection
     */
    afterAll(async () => {
        await dropCollections();
        await mongoose.connection.close();
        console.log('connection closed');
    });
    /**
     * remove transactions collection from database
     */
    afterEach(async () => {
        await transaction.removeDbTransaction();
    });
    test('should create new transaction and remove it', async () => {
        const transId = await transaction.getTransactionId();
        const trans = await transaction.loadDbTransaction(transId);
        expect(trans.status).toBe('pending');
        await transaction.removeDbTransaction(transId);
        expect(await transaction.loadDbTransaction(transId)).toBeNull();
    });
    test('should create transaction, insert, update and run', async () => {
        const person = 'Person';
        const transId = await transaction.getTransactionId();
        const tonyObject = {
            age: 28,
            name: 'Tony',
        };
        const nicolaObject = {
            age: 32,
            name: 'Nicola',
        };
        const id = transaction.insert(person, tonyObject);
        transaction.update(person, id, nicolaObject, {
            new: true,
        });
        let final;
        let trans;
        try {
            final = await transaction.run();
            expect(final).toBeInstanceOf(Array);
            expect(final.length).toBe(2);
            expect(final[0].name).toBe(tonyObject.name);
            expect(final[0].age).toBe(tonyObject.age);
            expect(final[1].name).toBe(nicolaObject.name);
            expect(final[1].age).toBe(nicolaObject.age);
            trans = await transaction.loadDbTransaction(transId);
            expect(trans.status).toBe('Success');
            expect(trans.operations).toBeInstanceOf(Array);
            expect(trans.operations.length).toBe(2);
            expect(trans.operations[0].status).toBe('Success');
            expect(trans.operations[1].status).toBe('Success');
        }
        catch (error) {
            // console.error('run err =>', error)
            expect(error).toBeNull();
        }
    });
    test('should create transaction, insert, update, remove(fail), run, rollback and rollback again', async () => {
        const person = 'Person';
        const transId = await transaction.getTransactionId();
        const tonyObject = {
            age: 28,
            name: 'Tony',
        };
        const nicolaObject = {
            age: 32,
            name: 'Nicola',
        };
        const id = transaction.insert(person, tonyObject);
        transaction.update(person, id, nicolaObject, {
            new: true,
        });
        const fakeId = new mongoose.Types.ObjectId();
        transaction.remove(person, fakeId);
        try {
            await transaction.run();
        }
        catch (err) {
            expect(err.error.error.message).toEqual('Entity not found');
            expect(err.data).toEqual({ _id: fakeId });
            expect(err.executedTransactions).toEqual(2);
            expect(err.remainingTransactions).toEqual(1);
        }
        try {
            const trans = await transaction.loadDbTransaction(transId);
            // console.log('trans =>', trans)
            expect(trans.status).toBe('Error');
            expect(trans.operations).toBeInstanceOf(Array);
            expect(trans.operations.length).toBe(3);
            expect(trans.operations[0].status).toBe('Success');
            expect(trans.operations[1].status).toBe('Success');
            expect(trans.operations[2].status).toBe('Error');
        }
        catch (err) {
            // console.error('err =>', err);
            expect(err).toBeNull();
        }
        try {
            const rolled = await transaction.rollback();
            // console.log('rolled =>', rolled)
            expect(rolled).toBeInstanceOf(Array);
            expect(rolled.length).toBe(2);
            expect(rolled[0].name).toBe('Nicola');
            expect(rolled[0].age).toBe(32);
            expect(rolled[1].name).toBe('Tony');
            expect(rolled[1].age).toBe(28);
        }
        catch (err) {
            // console.error('roll =>', err);
            expect(err).toBeNull();
        }
        try {
            const rolled = await transaction.rollback();
            // console.log('rolled =>', rolled)
            expect(rolled).toBeInstanceOf(Array);
            expect(rolled.length).toBe(0);
        }
        catch (err) {
            // console.error('roll =>', err);
            expect(err).toBeNull();
        }
    });
    test('should create transaction, insert, update, remove(fail),' +
        'save operations, load operations in new Transaction instance, run and rollback', async () => {
        const person = 'Person';
        const tonyObject = {
            age: 28,
            name: 'Tony',
        };
        const nicolaObject = {
            age: 32,
            name: 'Nicola',
        };
        const id = transaction.insert(person, tonyObject);
        transaction.update(person, id, nicolaObject, {
            new: true,
        });
        const fakeId = new mongoose.Types.ObjectId();
        transaction.remove(person, fakeId);
        const operations = await transaction.getOperations();
        const transId = await transaction.saveOperations();
        const newTransaction = new main_1.default(true);
        await newTransaction.loadDbTransaction(transId);
        const newOperations = await newTransaction.getOperations();
        expect(operations).toEqual(newOperations);
        try {
            await newTransaction.run();
        }
        catch (err) {
            console.log(err);
            expect(err.error.error.message).toEqual('Entity not found');
            expect(err.data).toEqual({ _id: fakeId });
            expect(err.executedTransactions).toEqual(2);
            expect(err.remainingTransactions).toEqual(1);
        }
        try {
            const trans = await newTransaction.loadDbTransaction(transId);
            // console.log('trans =>', trans)
            expect(trans.status).toBe('Error');
            expect(trans.operations).toBeInstanceOf(Array);
            expect(trans.operations.length).toBe(3);
            expect(trans.operations[0].status).toBe('Success');
            expect(trans.operations[1].status).toBe('Success');
            expect(trans.operations[2].status).toBe('Error');
        }
        catch (err) {
            console.error('err =>', err);
            expect(err).toBeNull();
        }
        try {
            const rolled = await newTransaction.rollback();
            // console.log('rolled =>', rolled)
            expect(rolled).toBeInstanceOf(Array);
            expect(rolled.length).toBe(2);
            expect(rolled[0].name).toBe('Nicola');
            expect(rolled[0].age).toBe(32);
            expect(rolled[1].name).toBe('Tony');
            expect(rolled[1].age).toBe(28);
        }
        catch (err) {
            // console.error('roll =>', err);
            expect(err).toBeNull();
        }
        try {
            const rolled = await newTransaction.rollback();
            // console.log('rolled =>', rolled)
            expect(rolled).toBeInstanceOf(Array);
            expect(rolled.length).toBe(0);
        }
        catch (err) {
            // console.error('roll =>', err);
            expect(err).toBeNull();
        }
    });
});
//# sourceMappingURL=db.spec.js.map