# eterna

CLI for [Eterna Exchange](https://eterna.exchange) — execute AI trading strategies from your terminal.

## Install

```bash
npx @eterna-hybrid-exchange/cli --help
```

Or install globally:

```bash
npm install -g @eterna-hybrid-exchange/cli
```

## Quick Start

```bash
# Authenticate (opens browser or shows device code for SSH)
npx @eterna-hybrid-exchange/cli login

# Execute a strategy file
npx @eterna-hybrid-exchange/cli execute strategy.ts

# Pipe code via stdin
echo 'const balance = await eterna.getBalance(); return balance;' | npx @eterna-hybrid-exchange/cli execute -

# Check balance and positions
npx @eterna-hybrid-exchange/cli balance
npx @eterna-hybrid-exchange/cli positions

# Browse the SDK
npx @eterna-hybrid-exchange/cli sdk --search "place order"
npx @eterna-hybrid-exchange/cli sdk --detail full
```

## Commands

| Command                 | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `eterna login`          | Authenticate with Eterna (browser or device code) |
| `eterna logout`         | Remove stored credentials                         |
| `eterna execute <file>` | Execute TypeScript in the Eterna sandbox          |
| `eterna sdk`            | Browse SDK method reference                       |
| `eterna balance`        | Get account balance (shortcut)                    |
| `eterna positions`      | Get open positions (shortcut)                     |

## Authentication

The CLI supports two authentication flows, auto-detected based on your environment:

- **Browser flow**: Opens your default browser for Google OAuth (used when running locally)
- **Device code flow**: Shows a URL and code to enter in any browser (used over SSH or with `--no-browser`)

Credentials are stored in `~/.eterna/credentials.json` and auto-refreshed when expired.

## Configuration

Config is stored in `~/.eterna/config.json`:

```json
{
  "endpoint": "https://ai-api.eterna.exchange"
}
```

Override the config directory with the `ETERNA_CONFIG_DIR` environment variable.

## License

MIT
