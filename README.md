# HabitTrove

HabitTrove is a gamified habit tracking application that helps you build and maintain positive habits by rewarding you with coins, which you can use to exchange for rewards.

> **⚠️ Important:** HabitTrove is currently in beta. Please regularly backup your `data/` directory to prevent any potential data loss.

## Try the Demo

Want to try HabitTrove before installing? Visit the public [demo instance](https://habittrove.app.enting.org) to experience all features without any setup required. (do not store personal info. Data on the demo instance is reset daily)

## Features

- 🎯 Create and track daily habits
- 🏆 Earn coins for completing habits
- 💰 Create a wishlist of rewards to redeem with earned coins
- 📊 View your habit completion streaks and statistics
- 📅 Calendar heatmap to visualize your progress (WIP)
- 🌙 Dark mode support (WIP)
- 📲 Progressive Web App (PWA) support (Planned)

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/dohsimpson/habittrove.git
cd habittrove
```

2. Install dependencies:

```bash
npm install --force
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. **Creating Habits**: Click the "Add Habit" button to create a new habit. Set a name, description, and coin reward.

2. **Tracking Habits**: Mark habits as complete on your dashboard. Each completion earns you the specified coins.

3. **Wishlist**: Add rewards to your wishlist that you can redeem with earned coins.

4. **Statistics**: View your progress through the heatmap and streak counters.

## Docker Deployment

HabitTrove can be run using Docker in several ways, depending on your needs:

### Using Pre-built Images

The easiest way to run HabitTrove is using our pre-built Docker images from DockerHub:

1. First, prepare the data directory with correct permissions:

```bash
mkdir -p data
chown -R 1001:1001 data  # Required for the nextjs user in container
```

2. Then run using either method:

```bash
# Using docker-compose (recommended)
docker compose up -d

# Or using docker run directly
docker run -d -p 3000:3000 -v ./data:/app/data dohsimpson/habittrove
```

Available image tags:

- `latest`: Stable release version, recommended for most users
- `vX.Y.Z` (e.g., `v0.1.4`): Specific version for reproducible deployments and rollbacks
- `dev`: Latest development build from the main branch, may contain unstable features

Choose your tag based on needs:

- Use `latest` for general production use
- Use version tags (e.g., `v0.1.4`) for reproducible deployments
- Use `dev` for testing new features

### Building Locally

If you want to build the image locally (useful for development):

```bash
# Build the Docker image
npm run docker-build

# Run the container
npm run docker-run
```

The application data will be persisted in the `data` directory in both cases.

## Contributing

Contributions are welcome! We appreciate both:

- Issue submissions for bug reports and feature requests
- Pull Requests for code contributions

For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
