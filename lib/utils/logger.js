const IS_DEV = true;

const logger = { 
    printLog : (...args) => {

        if (IS_DEV) {
            console.log(`[${args[0]}]`,
                args[1], 
                args[2] !== undefined ? args[2] : '',
                args[3] !== undefined ? args[3] : '',
                args[4] !== undefined ? args[4] : '');
        }

    }
}

module.exports = logger;