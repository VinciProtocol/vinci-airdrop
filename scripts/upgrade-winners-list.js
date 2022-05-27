;(async () => {
  const fs = require('fs')
  const { configPath, errorLogPath } = require('../envs')
  const configFile = await fs.readFileSync(configPath)
  const configData = JSON.parse(configFile.toString())
  const winnerSet = new Set()
  const errorWinnerSet = new Set()
  const repeatWinnerSet = new Set()

  Object.keys(configData.airdrop).forEach((winner) => winnerSet.add(winner.toLowerCase()))
  const winnerCount = winnerSet.size

  const winnersList = require('../winners-list/eth-2022-05-27')

  const winners = winnersList.split('\n')

  winners.forEach((winner) => {
    if (!winner) return
    winner = winner.toLowerCase()
    if (!winner.startsWith('0x') || winner.length !== 42) return errorWinnerSet.add(winner)
    if (winnerSet.has(winner)) return repeatWinnerSet.add(winner)
    winnerSet.add(winner)
  })

  console.log(`
total winner: ${winnerSet.size}
new winner: ${winnerSet.size - winnerCount}
error winner: ${errorWinnerSet.size}
repeat winner: ${repeatWinnerSet.size}
`)

  configData.airdrop = Array.from(winnerSet.values()).reduce((obj, winner) => {
    obj[winner] = 1
    return obj
  }, {})
  await fs.writeFileSync(configPath, JSON.stringify(configData, null, 2))
  await fs.writeFileSync(
    errorLogPath,
    JSON.stringify(
      {
        error: Array.from(errorWinnerSet.values()),
        repeat: Array.from(repeatWinnerSet.values()),
      },
      null,
      2
    )
  )
})()
