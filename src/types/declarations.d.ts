declare module 'react-confetti' {
  interface ConfettiProps {
    width: number
    height: number
    colors?: string[]
    numberOfPieces?: number
    recycle?: boolean
    run?: boolean
  }
  const Confetti: React.FC<ConfettiProps>
  export default Confetti
}
