# Peer-to-Peer Payment Splitter

## Overview

The **Peer-to-Peer Payment Splitter** is a NestJS-based application designed to manage and split expenses among participants in a group. It provides services for managing **expense groups**, recording **expenses**, and calculating the **balance** for each participant.

### Why NestJs

NestJS is a TypeScript-based framework that helps developers build efficient, scalable applications. It leverages **Dependency Injection (DI)**, promoting clean code architecture by managing dependencies between components. With a modular system, NestJS offers numerous integrations for common tasks like database access and authentication, simplifying development.

This project follows an **event-driven architecture**, where actions are triggered by events, enabling better scalability and efficient handling of asynchronous workflows.

### Why Gun

Gun.js is a real-time, distributed database **designed for peer-to-peer applications**. In this project, Gun.js facilitates decentralized data storage, enabling participants to access and update their balance data directly. By leveraging Gun.js, the app ensures that each participant's information is synchronized across the network without relying on a central server, promoting resilience and scalability in a peer-to-peer environment.

### Key Services

- **Expense Groups**: Allows users to create and manage groups of participants who will share and split expenses.
- **Expenses**: Allows users to add individual expenses within a group, specifying who paid and how the cost should be split among participants.
- **Balance**: Automatically calculates the balance for each participant based on the expenses they’ve paid and their share of the group's total expenses.

### Testing Flow

To test the functionality of the application, follow this simple flow:

1. **Create an Expense Group**: Set up a new group with participants who will share expenses.
2. **Create an Expense**: Add an expense to the group, specifying who paid and how the expense is split.
3. **Check Balances**: View the balance for each participant to see how much they owe or are owed.

### API Documentation

The project comes with a **Swagger UI** to easily explore and test the API. Access it by navigating to `http://localhost:3000/api-docs` once the application is running.

This allows you to interact with the API directly from your browser, making it simple to test creating expense groups, adding expenses, and checking balances.

---

## Prerequisites

Before running the project, ensure you have the following installed:

- Docker
- Docker Compose

---

## Running the Application

### 1. Clone the repository

```sh
git clone https://github.com/eduardo-js/nestjs-p2p-payment-splitter.git
```

### 2. Set up the Docker environment

The project includes a `docker-compose.yml` file to configure the services for LocalStack (for AWS S3 simulation) and Mailhog (for email simulation). The following services are set up:

- **app**: The NestJS application
- **localstack**: Simulates AWS S3 services
- **mailhog**: Simulates email services

Run the following command to start the services:

```sh
docker-compose up --build
```

This will:

- Build the `app` service based on the provided Dockerfile.
- Start LocalStack for simulating AWS services (specifically S3).
- Start Mailhog for simulating email sending.

MailHog captures outgoing emails for testing purposes. Access the MailHog UI at <http://localhost:8025> to view emails sent by the app,

### 3. Access the application

- The API will be available at `http://localhost:3000`.
- The Swagger API documentation can be accessed at `http://localhost:3000/api-docs`.

---

## API Endpoints

Here’s a brief overview of the key API endpoints:

1. **Create an Expense Group**:
   - `POST /expense-groups`
   - Body: `{ name: "Group Name", participants: ["Alice", "Bob"] }`

2. **Create an Expense**:
   - `POST /expenses`
   - Body: `{ amount: 50.00, paidBy: "Alice", splitType: "EQUALLY", expenseGroupId: "group-id" }`

3. **Check Balance**:
   - `GET /balances`
   - Returns the balance for all participants in all expense groups.

---

## Notes

Please note that this project is not production-ready. The code is not 100% tested, and certain configurations, such as S3 bucket visibility, do not pose major concerns as the app is intended for development and testing purposes only.

## Why Binary search on amount calculation?

Efficiently find the optimal split when distributing a total amount among participants.
Reference: [koko-eating-bananas](https://leetcode.com/problems/koko-eating-bananas/)

---

## License

This project is licensed under the MIT License.
