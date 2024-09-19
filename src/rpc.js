const amqplib = require("amqplib");
const { v4: uuid4 } = require("uuid");

let amqplibConnection = null;
// amqplib is a library that allows you to interact with RabbitMQ server

const getChannel = async () => {
    if (amqplibConnection === null) {
        amqplibConnection = await amqplib.connect("amqp://guest:guest@localhost:5672");
    }

    return await amqplibConnection.createChannel();
};

const expensiveDBOperation = (payload, fakeResponse) => {
    console.log(payload);
    console.log(fakeResponse);

    return new Promise((res, rej) => {
        setTimeout(() => {
            res(fakeResponse);
        }, 3000);
    });
};

// RPCObserver is a function that listens to a queue and performs an expensive operation.
const RPCObserver = async (RPC_QUEUE_NAME, fakeResponse) => {
    const channel = await getChannel();
    await channel.assertQueue(RPC_QUEUE_NAME, {
        durable: false, // durable: false means that the queue will not survive a broker restart
    });
    channel.prefetch(1); // prefetch(1) means that the broker will not send more than one message to a worker at a time

    channel.consume(
        RPC_QUEUE_NAME,
        async (msg) => {
            if (msg.content) {
                // DB Operation
                const payload = JSON.parse(msg.content.toString());
                const response = await expensiveDBOperation(payload, fakeResponse); // call fake DB operation function. This function will take 9 seconds to complete the operation.

                channel.sendToQueue(
                    msg.properties.replyTo, // replyTo is the queue where the response will be sent
                    Buffer.from(JSON.stringify(response)), // response
                    {
                        correlationId: msg.properties.correlationId, // correlationId is used to match the response with the request
                    }
                );
                channel.ack(msg);
            }
        },
        {
            noAck: false, // noAck: false means that the broker will wait for an acknowledgment of the message
        }
    );
};

const requestData = async (RPC_QUEUE_NAME, requestPayload, uuid) => {
    try {
        const channel = await getChannel();
        const q = await channel.assertQueue("", { exclusive: true });

        // send request to the queue
        channel.sendToQueue(
            RPC_QUEUE_NAME,
            Buffer.from(JSON.stringify(requestPayload)),
            {
                replyTo: q.queue,
                correlationId: uuid,
            }
        );

        return new Promise((resolve, reject) => {
            // timeout n
            const timeout = setTimeout(() => {
                channel.close();
                resolve("API could not fulfill the request!");
            }, 8000);
            channel.consume(
                q.queue,
                (msg) => {
                    if (msg.properties.correlationId === uuid) {
                        resolve(JSON.parse(msg.content.toString())); // resolve the response from the queue if the correlationId matches the uuid. Return the response to the caller.
                        clearTimeout(timeout);
                    } else {
                        reject("data Not found!");
                    }
                },
                {
                    noAck: true,
                }
            );
        });
    } catch (error) {
        console.log(error);
        return "error";
    }
};

// RPCRequest is a function that sends a request to a queue and waits for the response.
const RPCRequest = async (RPC_QUEUE_NAME, requestPayload) => {
    const uuid = uuid4(); // correlationId
    return await requestData(RPC_QUEUE_NAME, requestPayload, uuid);
};

module.exports = {
    getChannel,
    RPCObserver,
    RPCRequest,
};

//