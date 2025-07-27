# ProjectManning - Team Management Application

A comprehensive Angular-based team management application that allows you to manage teams, developers, skills, and vacation schedules with full CRUD operations. All data is stored locally in the browser's localStorage for a completely backend-less experience.

## 🌟 Features

- **Team Management**: Create, edit, and delete teams
- **Developer Management**: Manage developer profiles and skills
- **Manager Management**: Assign managers to teams
- **Skills Tracking**: Define and track technical and application skills
- **Vacation Management**: Track team vacation schedules
- **Local Storage**: All data stored in browser localStorage
- **Data Export/Import**: Backup and restore functionality
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Production Build
```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📦 Deployment

### GitHub Pages (Automatic)

1. **Push to GitHub**: Your app will automatically deploy when you push to the `main` branch
2. **Manual Deployment**: Run `npm run deploy` to manually deploy
3. **Access**: Your app will be available at `https://yourusername.github.io/project-manning/`

### Manual Deployment Steps

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

3. Configure GitHub Pages:
   - Go to your repository settings
   - Navigate to "Pages"
   - Select "gh-pages" branch as source
   - Save the settings

## 🛠️ Technology Stack

- **Frontend**: Angular 13
- **Styling**: SCSS
- **Data Storage**: Browser localStorage
- **Deployment**: GitHub Pages
- **Build Tool**: Angular CLI

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── managers/
│   │   ├── teams/
│   │   ├── developers/
│   │   ├── skills/
│   │   └── vacations/
│   ├── services/
│   │   ├── team-data.service.ts
│   │   └── team-management.service.ts
│   ├── models/
│   │   └── team-models.ts
│   └── assets/
│       └── team_manage_master.json
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run deploy` - Deploy to GitHub Pages
- `npm test` - Run unit tests
- `npm run watch` - Build in watch mode

## 📊 Data Management

The application stores all data in browser localStorage. You can:

- **Export Data**: Download JSON backup from dashboard
- **Import Data**: Upload JSON file to restore data
- **Reset Data**: Reset to initial state or clear all data
- **Monitor Size**: View data size and last updated time

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.
