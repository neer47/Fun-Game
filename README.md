# Raja, Mantri, Chor, Sipahi - Multiplayer Game

A real-time, multiplayer web-based version of the traditional Indian game **Raja, Mantri, Chor, Sipahi**, built with **React, Firebase, and Context API**.

![Game Preview](./preview.gif)

## 🏆 Features

- 🎮 **Multiplayer Mode**: Real-time gameplay using **Firebase Realtime Database** for seamless synchronization.
- 🔄 **Turn-Based Role Assignments**: Automatically assigns roles at the start of each round.
- 🔥 **Dynamic Animations**: Smooth card flipping animations and UI interactions.
- 📱 **Responsive UI**: Mobile-friendly game interface designed with **React and Tailwind CSS**.
- 🎭 **Engaging Gameplay**: Implements logic for choosing the thief, revealing roles, and scoring system.

## 🚀 Future Enhancements

- 💬 **In-Game Chat**: Add a chat feature for communication between players.
- 🤖 **AI Opponents**: Implement AI-based players for single-player mode.

## 🛠️ Tech Stack

- **Frontend**: React.js, Context API, Tailwind CSS
- **Backend**: Firebase Realtime Database
- **State Management**: Context API
- **Authentication**: Firebase Authentication (if implemented)
- **Hosting**: Firebase Hosting (optional)

## 🎮 How to Play?

1. **Join the Game**: Players join a game room using a unique room code.
2. **Role Assignment**: The game assigns random roles - **Raja, Mantri, Chor, Sipahi**.
3. **Gameplay**:
   - Raja: Observes the game.
   - Mantri: Identifies the Chor.
   - Chor: Tries to remain undetected.
   - Sipahi: Supports Mantri in guessing the Chor.
4. **Scoring**:
   - If Mantri correctly identifies the Chor, they score points.
   - If Mantri fails, the points are redistributed accordingly.
5. **Rounds Continue**: The game repeats for multiple rounds, and scores are updated in real-time.

## 🔧 Installation & Setup

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/neer47/raja-mantri-chor-sipahi.git
   cd raja-mantri-chor-sipahi
   ```

2. **Install Dependencies**:
   ```sh
   npm install
   ```

3. **Set Up Firebase**:
   - Create a Firebase project.
   - Enable Realtime Database.
   - Add Firebase config in `.env.local`.

4. **Run the Application**:
   ```sh
   npm start
   ```

## 📸 Screenshots

_![image](https://github.com/user-attachments/assets/afd7ff40-6fcc-469b-8a35-3a14755289ce)
_![Screenshot (9)](https://github.com/user-attachments/assets/42fd658b-7ad6-4aac-bec1-34d84cb694d2)



## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo, submit issues, or create pull requests.

## 📜 License

This project is licensed under the MIT License.

---

💡 **Developed by [Neer Jain](https://github.com/neer47)**

