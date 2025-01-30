"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const mongooseTransactions_collection_1 = require("./mongooseTransactions.collection");
/** Class representing a transaction. */
class Transaction {
    /** Index used for retrieve the executed transaction in the run */
    rollbackIndex = 0;
    /** Boolean value for enable or disable saving transaction on db */
    useDb = false;
    /** Boolean value for whether mongoose-delete models to be used */
    withDeleted = false;
    /** The id of the current transaction document on database */
    transactionId = '';
    /** The actions to execute on mongoose collections when transaction run is called */
    operations = [];
    /**
     * Create a transaction.
     * @param useDb - The boolean parameter allow to use transaction collection on db (default false)
     * @param transactionId - The id of the transaction to load, load the transaction
     *                        from db if you set useDb true (default "")
     */
    constructor(useDb = false, withDeleted = false) {
        this.useDb = useDb;
        this.transactionId = '';
        this.withDeleted = withDeleted;
    }
    /**
     * Load transaction from transaction collection on db.
     * @param transactionId - The id of the transaction to load.
     * @trows Error - Throws error if the transaction is not found
     */
    async loadDbTransaction(transactionId) {
        const loadedTransaction = await mongooseTransactions_collection_1.TransactionModel.findOne({
            _id: transactionId,
        })
            .lean()
            .exec();
        if (!loadedTransaction)
            return null;
        loadedTransaction.operations.forEach((operation) => {
            operation.model = mongoose.model(operation.modelName);
        });
        this.operations = loadedTransaction.operations;
        this.rollbackIndex = loadedTransaction.rollbackIndex;
        this.transactionId = transactionId;
        return loadedTransaction;
    }
    /**
     * Remove transaction from transaction collection on db,
     * if the transactionId param is null, remove all documents in the collection.
     * @param transactionId - Optional. The id of the transaction to remove (default null).
     */
    async removeDbTransaction(transactionId = null) {
        try {
            if (transactionId === null) {
                await mongooseTransactions_collection_1.TransactionModel.deleteMany({}).exec();
            }
            else {
                await mongooseTransactions_collection_1.TransactionModel.deleteOne({ _id: transactionId }).exec();
            }
        }
        catch (error) {
            throw new Error('Fail remove transaction[s] in removeDbTransaction');
        }
    }
    /**
     * If the instance is db true, return the actual or new transaction id.
     * @throws Error - Throws error if the instance is not a db instance.
     */
    async getTransactionId() {
        if (this.transactionId === '') {
            await this.createTransaction();
        }
        return this.transactionId;
    }
    /**
     * Get transaction operations array from transaction object or collection on db.
     * @param transactionId - Optional. If the transaction id is passed return the elements of the transaction id
     *                                  else return the elements of current transaction (default null).
     */
    async getOperations(transactionId = null) {
        if (transactionId) {
            const transaction = await mongooseTransactions_collection_1.TransactionModel.findOne({
                _id: transactionId,
            })
                .lean()
                .exec();
            return transaction;
        }
        else {
            return this.operations;
        }
    }
    /**
     * Save transaction operations array on db.
     * @throws Error - Throws error if the instance is not a db instance.
     * @return transactionId - The transaction id on database
     */
    async saveOperations() {
        if (this.transactionId === '') {
            await this.createTransaction();
        }
        await mongooseTransactions_collection_1.TransactionModel.updateOne({ _id: this.transactionId }, {
            operations: this.operations,
            rollbackIndex: this.rollbackIndex,
        });
        return this.transactionId;
    }
    /**
     * Clean the operations object to begin a new transaction on the same instance.
     */
    async clean() {
        this.operations = [];
        this.rollbackIndex = 0;
        this.transactionId = '';
        if (this.useDb) {
            await this.createTransaction();
        }
    }
    /**
     * Create the insert transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param data - The object containing data to insert into mongoose model.
     * @returns id - The id of the object to insert.
     */
    insert(modelName, data, options = {}) {
        const model = mongoose.model(modelName);
        if (!data._id) {
            data._id = new mongoose.Types.ObjectId();
        }
        const operation = {
            data,
            findObj: { _id: data._id },
            model,
            modelName,
            oldModel: null,
            options,
            rollbackType: 'remove',
            status: "Pending" /* Status.pending */,
            type: 'insert',
        };
        this.operations.push(operation);
        return data._id;
    }
    /**
     * Create the findOneAndUpdate transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findId - The id of the object to update.
     * @param dataObj - The object containing data to update into mongoose model.
     */
    update(modelName, findId, data, options = {}) {
        const model = mongoose.model(modelName);
        const operation = {
            data,
            findObj: { _id: findId },
            model,
            modelName,
            oldModel: null,
            options,
            rollbackType: 'update',
            status: "Pending" /* Status.pending */,
            type: 'update',
        };
        this.operations.push(operation);
        return operation;
    }
    /**
     * Create the findOneAndUpdate transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findObj - The filter to get the object to update.
     * @param dataObj - The object containing data to update into mongoose model.
     */
    updateOne(modelName, findObj, data, options = {}) {
        const model = mongoose.model(modelName);
        const operation = {
            data,
            findObj,
            model,
            modelName,
            oldModel: null,
            options,
            rollbackType: 'update',
            status: "Pending" /* Status.pending */,
            type: 'update',
        };
        this.operations.push(operation);
        return operation;
    }
    /**
     * Create the remove transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findId - The id of the data to find.
     */
    remove(modelName, findId, options = {}) {
        const model = mongoose.model(modelName);
        const operation = {
            data: null,
            findObj: { _id: findId },
            model,
            modelName,
            oldModel: null,
            options,
            rollbackType: 'insert',
            status: "Pending" /* Status.pending */,
            type: 'remove',
        };
        this.operations.push(operation);
        return operation;
    }
    /**
     * Create the remove transaction and rollback states.
     * @param modelName - The string containing the mongoose model name.
     * @param findObj - The filter to get the data to find.
     */
    removeOne(modelName, findObj, options = {}) {
        const model = mongoose.model(modelName);
        const operation = {
            data: null,
            findObj,
            model,
            modelName,
            oldModel: null,
            options,
            rollbackType: 'insert',
            status: "Pending" /* Status.pending */,
            type: 'remove',
        };
        this.operations.push(operation);
        return operation;
    }
    /**
     * Run the operations and check errors.
     * @returns Array of objects - The objects returned by operations
     *          Error - The error object containing:
     *                  data - the input data of operation
     *                  error - the error returned by the operation
     *                  executedTransactions - the number of executed operations
     *                  remainingTransactions - the number of the not executed operations
     */
    async run() {
        if (this.useDb && this.transactionId === '') {
            await this.createTransaction();
        }
        const final = [];
        return this.operations.reduce((promise, transaction, index) => {
            return promise.then(async () => {
                let operation;
                switch (transaction.type) {
                    case 'insert':
                        operation = this.insertTransaction(transaction.model, transaction.data);
                        break;
                    case 'update':
                        operation = this.findOneTransaction(transaction.model, transaction.findObj, transaction.options).then((findRes) => {
                            transaction.oldModel = findRes;
                            return this.updateTransaction(transaction.model, transaction.findObj, transaction.data, transaction.options);
                        });
                        break;
                    case 'remove':
                        operation = this.findOneTransaction(transaction.model, transaction.findObj, transaction.options).then((findRes) => {
                            transaction.oldModel = findRes;
                            return this.removeTransaction(transaction.model, transaction.findObj, transaction.options);
                        });
                        break;
                }
                return operation
                    .then(async (query) => {
                    this.rollbackIndex = index;
                    this.updateOperationStatus("Success" /* Status.success */, index);
                    if (index === this.operations.length - 1) {
                        await this.updateDbTransaction("Success" /* Status.success */);
                    }
                    final.push(query);
                    return final;
                })
                    .catch(async (err) => {
                    this.updateOperationStatus("Error" /* Status.error */, index);
                    await this.updateDbTransaction("Error" /* Status.error */);
                    throw err;
                });
            });
        }, Promise.resolve([]));
    }
    /**
     * Rollback the executed operations if any error occurred.
     * @param   stepNumber - (optional) the number of the operation to rollback - default to length of
     *                            operation successfully runned
     * @returns Array of objects - The objects returned by rollback operations
     *          Error - The error object containing:
     *                  data - the input data of operation
     *                  error - the error returned by the operation
     *                  executedTransactions - the number of rollbacked operations
     *                  remainingTransactions - the number of the not rollbacked operations
     */
    async rollback(howmany = this.rollbackIndex + 1) {
        if (this.useDb && this.transactionId === '') {
            await this.createTransaction();
        }
        let transactionsToRollback = this.operations.slice(0, this.rollbackIndex + 1);
        transactionsToRollback.reverse();
        if (howmany !== this.rollbackIndex + 1) {
            transactionsToRollback = transactionsToRollback.slice(0, howmany);
        }
        const final = [];
        return transactionsToRollback.reduce((promise, transaction, index) => {
            return promise.then(() => {
                let operation;
                switch (transaction.rollbackType) {
                    case 'insert':
                        if ((this.withDeleted ||
                            transaction.options?.withDeleted) &&
                            transaction.model['findOneWithDeleted']) {
                            operation = new Promise(async (resolve, reject) => {
                                const data = await transaction.model['findOneWithDeleted'](transaction.findObj)
                                    .lean()
                                    .exec();
                                transaction.model['restore'](transaction.findObj, (err) => {
                                    if (err) {
                                        return reject(this.transactionError(err, data));
                                    }
                                    else {
                                        return resolve(data);
                                    }
                                });
                            });
                        }
                        else {
                            operation = this.insertTransaction(transaction.model, transaction.oldModel);
                        }
                        break;
                    case 'update':
                        operation = this.updateTransaction(transaction.model, transaction.findObj, transaction.oldModel, {
                            withDeleted: this.withDeleted ||
                                transaction?.options?.withDeleted ||
                                false,
                        });
                        break;
                    case 'remove':
                        operation = this.removeTransaction(transaction.model, transaction.findObj);
                        break;
                }
                return operation
                    .then(async (query) => {
                    this.rollbackIndex--;
                    this.updateOperationStatus("Rollback" /* Status.rollback */, index);
                    if (index === this.operations.length - 1) {
                        await this.updateDbTransaction("Rollback" /* Status.rollback */);
                    }
                    final.push(query);
                    return final;
                })
                    .catch(async (err) => {
                    this.updateOperationStatus("ErrorRollback" /* Status.errorRollback */, index);
                    await this.updateDbTransaction("ErrorRollback" /* Status.errorRollback */);
                    throw err;
                });
            });
        }, Promise.resolve([]));
    }
    async findOneTransaction(model, findObj, options = { withDeleted: false }) {
        let fn = 'findOne';
        if ((this.withDeleted || options.withDeleted) &&
            model.findWithDeleted) {
            fn = 'findOneWithDeleted';
        }
        return await model[fn](findObj).lean().exec();
    }
    async createTransaction() {
        if (!this.useDb) {
            throw new Error('You must set useDB true in the constructor');
        }
        const transaction = await mongooseTransactions_collection_1.TransactionModel.create([
            {
                operations: this.operations,
                rollbackIndex: this.rollbackIndex,
            },
        ], { checkKeys: false });
        this.transactionId = transaction[0]._id
            ? transaction[0]._id
            : '';
        return transaction;
    }
    insertTransaction(model, data) {
        return model
            .create(data)
            .then((result) => result)
            .catch((err) => this.transactionError(err, data));
    }
    updateTransaction(model, findObj, data, options = {
        new: false,
        withDeleted: false,
    }) {
        let fn = 'findOneAndUpdate';
        const { withDeleted, ...updateOptions } = options;
        if ((this.withDeleted || options.withDeleted) &&
            model.findOneAndUpdateWithDeleted) {
            fn = 'findOneAndUpdateWithDeleted';
        }
        return model[fn](findObj, data, options)
            .then((result) => {
            if (!result) {
                this.transactionError(new Error('Entity not found'), {
                    findObj,
                    data,
                });
            }
            return result;
        })
            .catch((err) => this.transactionError(err, { findObj, data }));
    }
    removeTransaction(model, findObj, options = { withDeleted: false }) {
        if ((this.withDeleted || options.withDeleted) &&
            model.findOneWithDeleted) {
            return model
                .findOneWithDeleted(findObj)
                .lean()
                .exec()
                .then((data) => {
                if (!data) {
                    throw new Error('Entity not found');
                }
                return model.delete(findObj).then(() => data);
            })
                .catch((err) => {
                this.transactionError(err, findObj);
            });
            return;
        }
        return model
            .findOneAndDelete(findObj)
            .then((result) => {
            if (!result) {
                this.transactionError(new Error('Entity not found'), findObj);
            }
            else {
                return result;
            }
        })
            .catch((err) => this.transactionError(err, findObj));
    }
    transactionError(error, data) {
        throw {
            data,
            error,
            executedTransactions: this.rollbackIndex + 1,
            remainingTransactions: this.operations.length - (this.rollbackIndex + 1),
        };
    }
    updateOperationStatus(status, index) {
        this.operations[index].status = status;
    }
    async updateDbTransaction(status) {
        if (this.useDb && this.transactionId !== '') {
            return await mongooseTransactions_collection_1.TransactionModel.findByIdAndUpdate(this.transactionId, {
                operations: this.operations,
                rollbackIndex: this.rollbackIndex,
                status,
            }, { new: true });
        }
    }
}
exports.default = Transaction;
//# sourceMappingURL=main.js.map