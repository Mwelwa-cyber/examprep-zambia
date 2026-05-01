import Navbar from './Navbar'
import GameStickerStyles from '../games/GameStickerStyles'

export default function LearnerShell({ children, showNav = true }) {
  return (
    <div className="learner-game-theme learner-app-shell min-h-screen theme-bg flex flex-col">
      <GameStickerStyles />
      {showNav ? <Navbar /> : null}
      <div className="relative z-10 flex-1">
        {children}
      </div>
    </div>
  )
}
