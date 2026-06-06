# Zero-Trust Vault

A highly secure, end-to-end encrypted file storage ecosystem designed with a "zero-trust" philosophy. Built by security-focused engineers, this application ensures that your data remains yours alone, leveraging enterprise-grade cryptography.

## Overview

Zero-Trust Vault is a modern web application that allows users to securely store and retrieve files. Instead of relying on traditional storage methods where the server implicitly trusts its administrators, this application cryptographically protects data both in transit and at rest. It demonstrates core information security principles, making it virtually impossible for unauthorized entities—including database administrators—to read or maliciously modify user data without detection.

## Core Security Features

- **End-to-End File Encryption:** All files are symmetrically encrypted at rest using robust OpenSSL algorithms.
- **Cryptographic Integrity Verification:** The system continuously verifies file integrity against cryptographic hashes to detect any unauthorized tampering or database corruption.
- **Stateless Authentication:** User sessions are managed securely through JSON Web Tokens (JWT) without exposing credentials.
- **Defense-in-Depth Architecture:** Engineered with isolated backup mechanisms to protect against targeted data destruction.
- **Password Obfuscation:** Passwords are mathematically hashed with unique salts, ensuring complete protection against dictionary and rainbow table attacks.

## Tech Stack

- **Client Framework:** React.js
- **UI Architecture:** Tailwind CSS
- **Runtime Environment:** Node.js
- **Database:** MongoDB
- **Cryptography:** OpenSSL

## Development Team

- Frontend Developer: M.Salman Haider
- Backend Developer: S.Kanzul Eman
- Cryptography Specialist: Moin Ali

---

*This project was developed for the Information Security Lab (4th Semester).*
