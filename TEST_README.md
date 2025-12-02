# Testing Guide

## Running Tests

To run all tests:
```bash
npm test
```

## Test Structure

- `scoreManager.test.js` - Tests for the score tracking system
  - Property-based tests using fast-check (100 iterations each)
  - Unit tests for edge cases

## Property-Based Tests

The tests use fast-check to verify properties across randomly generated inputs:

1. **Property 1**: Item collection increases score - validates that adding positive points always increases the score
2. **Property 6**: High score persistence round-trip - validates that saving and loading high scores preserves the value

## Unit Tests

- High score initialization when localStorage is empty
- Handling corrupted localStorage data
- Score clamping to prevent negative values
