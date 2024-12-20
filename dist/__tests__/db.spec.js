"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("../src/main");
var mongoose = require("mongoose");
// @ts-ignore
mongoose.Promise = global.Promise;
describe('Transaction using DB ', function () {
    var options = {
        useCreateIndex: true,
        useFindAndModify: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    };
    mongoose.connection
        .once('open', function () {
        console.log('Mongo connected!');
    })
        .on('error', function (err) { return console.warn('Warning', err); });
    var transaction;
    var personSchema = new mongoose.Schema({
        age: Number,
        name: String,
    });
    var carSchema = new mongoose.Schema({
        age: Number,
        name: String,
    });
    var Person = mongoose.model('Person', personSchema);
    var Car = mongoose.model('Car', carSchema);
    function dropCollections() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Person.deleteMany({})];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, Car.deleteMany({})];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    /**
     * connect to database
     */
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mongoose.connect("mongodb://127.0.0.1:27017/mongoose-transactions", options)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    /**
     * drop database collections
     * create new Transaction using database storage
     */
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var useDB;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dropCollections()];
                case 1:
                    _a.sent();
                    useDB = true;
                    transaction = new main_1.default(useDB);
                    return [2 /*return*/];
            }
        });
    }); });
    /**
     * drop database collections
     * close database connection
     */
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dropCollections()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, mongoose.connection.close()];
                case 2:
                    _a.sent();
                    console.log('connection closed');
                    return [2 /*return*/];
            }
        });
    }); });
    /**
     * remove transactions collection from database
     */
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, transaction.removeDbTransaction()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should create new transaction and remove it', function () { return __awaiter(void 0, void 0, void 0, function () {
        var transId, trans, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, transaction.getTransactionId()];
                case 1:
                    transId = _b.sent();
                    return [4 /*yield*/, transaction.loadDbTransaction(transId)];
                case 2:
                    trans = _b.sent();
                    expect(trans.status).toBe('pending');
                    return [4 /*yield*/, transaction.removeDbTransaction(transId)];
                case 3:
                    _b.sent();
                    _a = expect;
                    return [4 /*yield*/, transaction.loadDbTransaction(transId)];
                case 4:
                    _a.apply(void 0, [_b.sent()]).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should create transaction, insert, update and run', function () { return __awaiter(void 0, void 0, void 0, function () {
        var person, transId, tonyObject, nicolaObject, id, final, trans, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    person = 'Person';
                    return [4 /*yield*/, transaction.getTransactionId()];
                case 1:
                    transId = _a.sent();
                    tonyObject = {
                        age: 28,
                        name: 'Tony',
                    };
                    nicolaObject = {
                        age: 32,
                        name: 'Nicola',
                    };
                    id = transaction.insert(person, tonyObject);
                    transaction.update(person, id, nicolaObject, { new: true });
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, transaction.run()];
                case 3:
                    final = _a.sent();
                    expect(final).toBeInstanceOf(Array);
                    expect(final.length).toBe(2);
                    expect(final[0].name).toBe(tonyObject.name);
                    expect(final[0].age).toBe(tonyObject.age);
                    expect(final[1].name).toBe(nicolaObject.name);
                    expect(final[1].age).toBe(nicolaObject.age);
                    return [4 /*yield*/, transaction.loadDbTransaction(transId)];
                case 4:
                    trans = _a.sent();
                    expect(trans.status).toBe('Success');
                    expect(trans.operations).toBeInstanceOf(Array);
                    expect(trans.operations.length).toBe(2);
                    expect(trans.operations[0].status).toBe('Success');
                    expect(trans.operations[1].status).toBe('Success');
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    // console.error('run err =>', error)
                    expect(error_1).toBeNull();
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    test('should create transaction, insert, update, remove(fail), run, rollback and rollback again', function () { return __awaiter(void 0, void 0, void 0, function () {
        var person, transId, tonyObject, nicolaObject, id, fakeId, final, err_1, trans, err_2, rolled, err_3, rolled, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    person = 'Person';
                    return [4 /*yield*/, transaction.getTransactionId()];
                case 1:
                    transId = _a.sent();
                    tonyObject = {
                        age: 28,
                        name: 'Tony',
                    };
                    nicolaObject = {
                        age: 32,
                        name: 'Nicola',
                    };
                    id = transaction.insert(person, tonyObject);
                    transaction.update(person, id, nicolaObject, { new: true });
                    fakeId = new mongoose.Types.ObjectId();
                    transaction.remove(person, fakeId);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, transaction.run()];
                case 3:
                    final = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    expect(err_1.error.message).toEqual('Entity not found');
                    expect(err_1.data).toEqual({ _id: fakeId });
                    expect(err_1.executedTransactions).toEqual(2);
                    expect(err_1.remainingTransactions).toEqual(1);
                    return [3 /*break*/, 5];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, transaction.loadDbTransaction(transId)
                        // console.log('trans =>', trans)
                    ];
                case 6:
                    trans = _a.sent();
                    // console.log('trans =>', trans)
                    expect(trans.status).toBe('Error');
                    expect(trans.operations).toBeInstanceOf(Array);
                    expect(trans.operations.length).toBe(3);
                    expect(trans.operations[0].status).toBe('Success');
                    expect(trans.operations[1].status).toBe('Success');
                    expect(trans.operations[2].status).toBe('Error');
                    return [3 /*break*/, 8];
                case 7:
                    err_2 = _a.sent();
                    // console.error('err =>', err);
                    expect(err_2).toBeNull();
                    return [3 /*break*/, 8];
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, transaction.rollback()
                        // console.log('rolled =>', rolled)
                    ];
                case 9:
                    rolled = _a.sent();
                    // console.log('rolled =>', rolled)
                    expect(rolled).toBeInstanceOf(Array);
                    expect(rolled.length).toBe(2);
                    expect(rolled[0].name).toBe('Nicola');
                    expect(rolled[0].age).toBe(32);
                    expect(rolled[1].name).toBe('Tony');
                    expect(rolled[1].age).toBe(28);
                    return [3 /*break*/, 11];
                case 10:
                    err_3 = _a.sent();
                    // console.error('roll =>', err);
                    expect(err_3).toBeNull();
                    return [3 /*break*/, 11];
                case 11:
                    _a.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, transaction.rollback()
                        // console.log('rolled =>', rolled)
                    ];
                case 12:
                    rolled = _a.sent();
                    // console.log('rolled =>', rolled)
                    expect(rolled).toBeInstanceOf(Array);
                    expect(rolled.length).toBe(0);
                    return [3 /*break*/, 14];
                case 13:
                    err_4 = _a.sent();
                    // console.error('roll =>', err);
                    expect(err_4).toBeNull();
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    }); });
    test('should create transaction, insert, update, remove(fail),' +
        'save operations, load operations in new Transaction instance, run and rollback', function () { return __awaiter(void 0, void 0, void 0, function () {
        var person, tonyObject, nicolaObject, id, fakeId, operations, transId, newTransaction, newOperations, final, err_5, trans, err_6, rolled, err_7, rolled, err_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    person = 'Person';
                    tonyObject = {
                        age: 28,
                        name: 'Tony',
                    };
                    nicolaObject = {
                        age: 32,
                        name: 'Nicola',
                    };
                    id = transaction.insert(person, tonyObject);
                    transaction.update(person, id, nicolaObject, {
                        new: true,
                    });
                    fakeId = new mongoose.Types.ObjectId();
                    transaction.remove(person, fakeId);
                    return [4 /*yield*/, transaction.getOperations()];
                case 1:
                    operations = _a.sent();
                    return [4 /*yield*/, transaction.saveOperations()];
                case 2:
                    transId = _a.sent();
                    newTransaction = new main_1.default(true);
                    return [4 /*yield*/, newTransaction.loadDbTransaction(transId)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, newTransaction.getOperations()];
                case 4:
                    newOperations = _a.sent();
                    expect(operations).toEqual(newOperations);
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, newTransaction.run()];
                case 6:
                    final = _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_5 = _a.sent();
                    expect(err_5.error.message).toEqual('Entity not found');
                    expect(err_5.data).toEqual({ _id: fakeId });
                    expect(err_5.executedTransactions).toEqual(2);
                    expect(err_5.remainingTransactions).toEqual(1);
                    return [3 /*break*/, 8];
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, newTransaction.loadDbTransaction(transId)
                        // console.log('trans =>', trans)
                    ];
                case 9:
                    trans = _a.sent();
                    // console.log('trans =>', trans)
                    expect(trans.status).toBe('Error');
                    expect(trans.operations).toBeInstanceOf(Array);
                    expect(trans.operations.length).toBe(3);
                    expect(trans.operations[0].status).toBe('Success');
                    expect(trans.operations[1].status).toBe('Success');
                    expect(trans.operations[2].status).toBe('Error');
                    return [3 /*break*/, 11];
                case 10:
                    err_6 = _a.sent();
                    console.error('err =>', err_6);
                    expect(err_6).toBeNull();
                    return [3 /*break*/, 11];
                case 11:
                    _a.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, newTransaction.rollback()
                        // console.log('rolled =>', rolled)
                    ];
                case 12:
                    rolled = _a.sent();
                    // console.log('rolled =>', rolled)
                    expect(rolled).toBeInstanceOf(Array);
                    expect(rolled.length).toBe(2);
                    expect(rolled[0].name).toBe('Nicola');
                    expect(rolled[0].age).toBe(32);
                    expect(rolled[1].name).toBe('Tony');
                    expect(rolled[1].age).toBe(28);
                    return [3 /*break*/, 14];
                case 13:
                    err_7 = _a.sent();
                    // console.error('roll =>', err);
                    expect(err_7).toBeNull();
                    return [3 /*break*/, 14];
                case 14:
                    _a.trys.push([14, 16, , 17]);
                    return [4 /*yield*/, newTransaction.rollback()
                        // console.log('rolled =>', rolled)
                    ];
                case 15:
                    rolled = _a.sent();
                    // console.log('rolled =>', rolled)
                    expect(rolled).toBeInstanceOf(Array);
                    expect(rolled.length).toBe(0);
                    return [3 /*break*/, 17];
                case 16:
                    err_8 = _a.sent();
                    // console.error('roll =>', err);
                    expect(err_8).toBeNull();
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=db.spec.js.map