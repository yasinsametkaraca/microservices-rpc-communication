#### What is the RPC (Remote Procedure Call)?
RPC (Remote Procedure Call) is a protocol that one program can use to request a service from a program located on another computer in a network without having to understand the network's details. A procedure call is also sometimes known as a function call or a subroutine call.

Redundant data is a common problem in microservices architecture. To solve this problem with RPC, you can use a message broker to send messages between microservices.

We all know how to call api and get some response with the help of HTTP calls in NodeJS but when it comes to distributed DB we need to think about a machanism to fullfil the requirement.

In this repository we have implemented Message Broker RPC call to communicate with other microservice to get on demand data from distributed DB.

### How to run the project:
```
yarn install
``` 

```
yarn start
```