//------------------------------------------------------------------------------------------------//
// This file is part of the Nebula Logger project, released under the MIT License.                //
// See LICENSE file or go to https://github.com/jongpie/NebulaLogger for full license details.    //
//------------------------------------------------------------------------------------------------//
import getSettings from '@salesforce/apex/ComponentLogger.getSettings';
import saveComponentLogEntries from '@salesforce/apex/ComponentLogger.saveComponentLogEntries';
import { newLogEntry } from './logEntryBuilder';

const LoggerService = class {
    _componentLogEntries = [];
    _pendingNewEntriesToSave = 0;
    _scenario;
    _settings;

    constructor() {}

    async getUserSettings() {
        if (!this._settings) {
            getSettings()
                .then(response => {
                    this._settings = response;
                    console.log('loaded the user settings!');
                    return this._settings;
                })
                .catch(error => {
                    /* eslint-disable-next-line no-console */
                    console.error(error);
                });
        }
        return this._settings;
    }

    setScenario(scenario) {
        this._scenario = scenario;
        this._componentLogEntries.forEach(logEntry => {
            logEntry.scenario = this._scenario;
        });
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.ERROR`
     * @param {String} message The string to use to set the entry's message field
     * @return {LogEntryBuilder} The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    error(message) {
        return this._newEntry('ERROR', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.WARN`
     * @param {String} message The string to use to set the entry's message field
     * @return {LogEntryBuilder} The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    warn(message) {
        return this._newEntry('WARN', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.INFO`
     * @param {String} message The string to use to set the entry's message field
     * @return {LogEntryBuilder} The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    info(message) {
        return this._newEntry('INFO', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.DEBUG`
     * @param {String} message The string to use to set the entry's message field
     * @return {LogEntryBuilder} The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    debug(message) {
        return this._newEntry('DEBUG', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.FINE`
     * @param {String} message The string to use to set the entry's message field
     * @return {LogEntryBuilder} The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    fine(message) {
        return this._newEntry('FINE', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.FINER`
     * @param {String} message The string to use to set the entry's message field
     * @return {LogEntryBuilder} The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    finer(message) {
        return this._newEntry('FINER', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.FINEST`
     * @param {String} message The string to use to set the entry's message field
     * @return {LogEntryBuilder} The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    finest(message) {
        return this._newEntry('FINEST', message);
    }

    /**
     * @description Returns the number of entries that have been generated but not yet saved
     * @return {Integer} The buffer's current size
     */
    getBufferSize() {
        return this._componentLogEntries.length;
    }

    /**
     * @description Discards any entries that have been generated but not yet saved
     */
    flushBuffer() {
        this._componentLogEntries = [];
    }

    /**
     * @description Saves any entries in Logger's buffer, using the specified save method for only this call.
     *              All subsequent calls to saveLog() will use the transaction save method.
     * @param  {String} saveMethod The enum value of Logger.SaveMethod to use for this specific save action.
     */
    saveLog(saveMethodName) {
        console.log('hello! running saveLog(), buffer size: ' + this.getBufferSize());
        if (this.getBufferSize() > 0) {
            if (!saveMethodName && this.getUserSettings()?.defaultSaveMethodName) {
                saveMethodName = this.getUserSettings().defaultSaveMethodName;
            }

            saveComponentLogEntries({ componentLogEntries: this._componentLogEntries, saveMethodName: saveMethodName })
                .then(this.flushBuffer())
                .catch(error => {
                    if (this.getUserSettings().isConsoleLoggingEnabled === true) {
                        /* eslint-disable-next-line no-console */
                        console.error(error);
                        /* eslint-disable-next-line no-console */
                        console.error(this._componentLogEntries);
                    }
                });
        }
    }

    // Private functions
    _meetsUserLoggingLevel(logEntryLoggingLevel) {
        console.log('running _meetsUserLoggingLevel', logEntryLoggingLevel, this._settings);
        let logEntryLoggingLevelOrdinal = this._settings.supportedLoggingLevels[logEntryLoggingLevel];
        return this._settings.isEnabled === true && this._settings.userLoggingLevel.ordinal <= logEntryLoggingLevelOrdinal;
    }

    async _newEntry(loggingLevel, message) {
        this._pendingNewEntriesToSave++;
        console.log('adding a new entry', { loggingLevel, message });

        // await this.getUserSettings().then(async () => {
        getSettings()
            .then(response => {
                this._settings = response;
                console.info('ran _newEntry() & loaded settings', this._settings);
            })
            // await this.getUserSettings().then(async () => {
            .then(() => {
                console.log('and then??', this._settings);
                // if (this._settings) {
                const shouldSave = this._meetsUserLoggingLevel(loggingLevel);
                console.log({ shouldSave });
                const logEntryBuilder = newLogEntry(loggingLevel, shouldSave, this._settings.isConsoleLoggingEnabled).setMessage(message);
                if (this._scenario) {
                    logEntryBuilder.scenario = this._scenario;
                }
                if (this._meetsUserLoggingLevel(loggingLevel) === true) {
                    this._componentLogEntries.push(logEntryBuilder);
                }
                // } else {
                //     this._enqueuedComponentLogEntries.push({ loggingLevel, message });
                //     console.log('this._enqueuedComponentLogEntries', this._enqueuedComponentLogEntries);
                // }

                console.log('added a new entry builder', { logEntryBuilder });
                return logEntryBuilder;
            });
    }
};

export const logger = new LoggerService();

export function getLoggerService() {
    return new LoggerService();
}
