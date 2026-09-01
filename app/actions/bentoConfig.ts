'use server'

import fs from 'fs'
import path from 'path'

const configPath = path.join(process.cwd(), 'app', 'data', 'bentoConfig.json')

export async function getBentoConfig() {
  try {
    const data = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    return { ownTechCols: 4, actinCols: 3 }
  }
}

export async function updateBentoConfig(config: { ownTechCols: number, actinCols: number }) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}
