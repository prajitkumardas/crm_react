import cron from 'node-cron'
import whatsappAutomation from './lib/whatsappAutomation.js'

console.log('Starting WhatsApp cron job...')

cron.schedule('0 * * * *', async () => {
  console.log('Running WhatsApp automation: ', new Date().toISOString())
  await whatsappAutomation.runAutomation()
})

console.log('WhatsApp automation cron job scheduled (hourly)')