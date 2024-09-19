## What is the RPC (Remote Procedure Call)?
RPC (Remote Procedure Call) is a protocol that one program can use to request a service from a program located on another computer in a network without having to understand the network's details. A procedure call is also sometimes known as a function call or a subroutine call.

Redundant data is a common problem in microservices architecture. To solve this problem with RPC, you can use a message broker to send messages between microservices.

We all know how to call api and get some response with the help of HTTP calls in NodeJS but when it comes to distributed DB we need to think about a machanism to fullfil the requirement.

In this repository we have implemented Message Broker RPC call to communicate with other microservice to get on demand data from distributed DB.


## In the RPC (Remote Procedure Call) Pattern Using RabbitMQ

**`requestData`** and **`RPCObserver`** serve different roles, and understanding their interaction is crucial:

### `requestData` (Client):

The client sends a request to a specific RabbitMQ queue and waits for a response. Even though the **`RPCObserver`** (server) is listening for incoming requests, the client must still wait for the response because it doesn't know when the server will complete the task. This waiting is necessary because the RPC pattern simulates a synchronous request-response flow, even though the communication is happening asynchronously through queues.

- **Why wait for a response?**: The client (via `requestData`) needs the result of the operation before proceeding. Without the result, it cannot continue its logic. The **`RPCObserver`** might take time to process the request, especially if the operation is expensive or time-consuming, and the client needs to wait for that processing to finish. If the client doesn’t wait, the whole purpose of making a request and getting a result is lost.

### `RPCObserver` (Server):

The **`RPCObserver`** listens to the queue, processes the requests it receives, and sends a response back to the client. Just because the server is listening and processing requests doesn’t mean the client should assume the response will instantly be ready. Depending on the workload or complexity of the request, the server might take a while to send the response.

### Key Point:
The client (`requestData`) waits because the RPC model is about making a request and expecting a result. The **`RPCObserver`** is listening and will send the response when it's ready, but the client must still handle the delay or timeout. The client and server operate asynchronously, but the client needs the result to proceed. This waiting is what enables the RPC mechanism to work in a request-response flow over RabbitMQ queues.


## RabbitMQ Operations Without RPC:

When using RabbitMQ, operations occur in a completely asynchronous manner. In this setup, a producer sends messages to queues, and a consumer can take and process these messages whenever needed. The client leaves the message in the queue and does not have to wait for a response.

- **Message-based communication**: There can be a time gap between when the message is sent and when it is processed. RabbitMQ ensures that tasks are distributed and taken from the queue. In this model, the initiator simply places the message in the queue and does nothing further, not expecting an immediate result. The consumer retrieves the message from the queue, processes it, and completes its own tasks.
- **Usage Example**: A producer leaves a message in the queue for a specific operation. The consumer retrieves this message at a later time and processes it. The result does not directly return to the producer, and the process is independent.

## RPC and RabbitMQ Operations:

When using RPC with RabbitMQ, an asynchronous request-response system is created. The client sends a request to a RabbitMQ queue and waits for the result. This waiting simulates synchronous processing, even though message queues are operating in the background.

- **Response Waiting**: In RPC, the client waits for the server to complete the process. RabbitMQ forwards the request to the server, and after the server finishes processing, it sends the result back to a response queue. The client retrieves the result from these response queues. The client waits until the process is fully completed.
- **Usage Example**: A client sends a computation request to a RabbitMQ queue. The server takes this request, performs the computation, and places the result back in the queue. The client waits for the result, and the operation is considered complete only when the result is received.

## Key Differences:

### Asynchronous Operations with RabbitMQ (Without RPC):

- The client sends a message and does not wait for the result.
- There is no direct response process between the producer and the consumer. The operations are completely independent.
- **Usage**: Background processes, independent tasks.

### Synchronous Operations with RPC and RabbitMQ:

- The client sends a request and waits for the result.
- A request-response cycle is established over RabbitMQ queues. The client waits until the response is received and the process is considered complete.
- **Usage**: Scenarios where the client starts an operation and needs to get the result (e.g., database queries, heavy computations).

### Should the Main Operation (db operations etc.) Be Done in `RPCObserver` or in the Return of `requestData`?

The main operation (such as a database query, computation, or other time-consuming tasks) should be performed in the **`RPCObserver`**. This is because **`RPCObserver`** acts as the server and processes incoming requests, while `requestData` only sends the request and waits for the result.

### 1. The Main Operation is Done in `RPCObserver`:
- **Role**: `RPCObserver` receives requests and performs the main operation. This could be a long-running or resource-intensive task (such as a database query, file processing, or calling an external API).
- **How It Works**: When a request is sent to the RabbitMQ queue, `RPCObserver` captures it and processes it. Once the operation is complete, `RPCObserver` sends the result back to `requestData` (the client) through the queue.

### 2. `requestData` Waits for the Result:
- **Role**: `requestData` is responsible for sending a request and waiting for the response. It listens to a temporary queue and waits for the result of the operation that was processed by `RPCObserver`.
- **Return Section**: The return part of `requestData` simply provides the result processed by `RPCObserver`. `requestData` does not handle the main operation itself; it just sends the request and returns the result once it receives the response from the server.

### In Summary:
- **The operation is done in `RPCObserver`**: The server processes the request, such as performing a database query, file operation, or complex computation.
- **`requestData` waits for the result**: The client uses `requestData` to send the request and wait for the result, but the main operation is handled by `RPCObserver` and the result is returned to `requestData`.

This ensures the correct roles for both the client and server in the asynchronous nature of RPC with RabbitMQ.

## To Understand the Logic of RPC in RabbitMQ (Scenario):
You can test the RPC pattern with RabbitMQ by following these steps:

http://localhost:8000/customer (Product service is running on 8000 port. We receive the customer service response in the product service.)

`Response: {"_id":"123456","name":"YSK","country":"Turkey"}`

http://localhost:9000/wishlist (Customer service is running on 9000 port. We receive the product service response in the customer service.)

`Response: {"_id":"123456","title":"sample product","price":300}`

## How to run the project:
```
yarn install
``` 

```
yarn start
```