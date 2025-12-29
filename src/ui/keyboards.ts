// src/ui/keyboards.ts
import { Markup } from 'telegraf';
import { COPY } from '../constants/copy';

export const Keyboards = {
  onboarding: Markup.inlineKeyboard([
    [Markup.button.callback(COPY.ONBOARDING.BUTTON_CREATE, 'create_wallet')],
    [Markup.button.callback(COPY.ONBOARDING.BUTTON_RESTORE, 'restore_wallet')],
    [Markup.button.callback(COPY.ONBOARDING.BUTTON_HELP, 'help')]
  ]),

  dashboard: Markup.inlineKeyboard([
    [
      Markup.button.callback(COPY.DASHBOARD.BUTTON_RECEIVE, 'receive'),
      Markup.button.callback(COPY.DASHBOARD.BUTTON_SEND, 'send_start')
    ],
    [Markup.button.callback(COPY.DASHBOARD.BUTTON_HISTORY, 'history')],
    [Markup.button.callback(COPY.DASHBOARD.BUTTON_SECURITY, 'security')]
  ]),

  receive: Markup.inlineKeyboard([
    [Markup.button.callback(COPY.RECEIVE.BUTTON_COPY, 'copy_address')],
    [Markup.button.callback(COPY.RECEIVE.BUTTON_QR, 'show_qr')],
    [Markup.button.callback(COPY.RECEIVE.BUTTON_BACK, 'back_to_dashboard')]
  ]),

  cancelOnly: Markup.inlineKeyboard([
    [Markup.button.callback(COPY.SEND.BUTTON_CANCEL, 'cancel_flow')]
  ]),

  confirmTransaction: Markup.inlineKeyboard([
    [Markup.button.callback(COPY.SEND.BUTTON_CONFIRM, 'confirm_tx'), Markup.button.callback(COPY.SEND.BUTTON_CANCEL, 'cancel_flow')]
  ]),

  security: Markup.inlineKeyboard([
    [Markup.button.callback(COPY.SECURITY.BUTTON_PIN, 'change_pin')],
    [Markup.button.callback(COPY.SECURITY.BUTTON_LIMIT, 'daily_limit')],
    [Markup.button.callback(COPY.SECURITY.BUTTON_LOCK, 'lock_wallet')],
    [Markup.button.callback(COPY.RECEIVE.BUTTON_BACK, 'back_to_dashboard')]
  ]),
  
  // Specific back button fix
  backToDashboard: Markup.inlineKeyboard([
    [Markup.button.callback(COPY.RECEIVE.BUTTON_BACK, 'back_to_dashboard')]
  ])
};
