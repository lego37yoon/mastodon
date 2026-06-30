# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::Settings::Appearance' do
  let(:admin_user) { Fabricate(:admin_user) }

  before { sign_in(admin_user) }

  it 'Saves changes to appearance settings' do
    visit admin_settings_appearance_path
    expect(page)
      .to have_title(I18n.t('admin.settings.appearance.title'))

    fill_in custom_css_field,
            with: 'html { display: inline; }'

    click_on submit_button

    expect(page)
      .to have_private_cache_control

    check confirm_reblog_field
    uncheck confirm_delete_field

    check advanced_layout_field

    expect { save_changes }
      .to change { user.reload.settings['web.reblog_modal'] }.to(true)
      .and change { user.reload.settings['web.delete_modal'] }.to(false)
      .and(change { user.reload.settings['web.advanced_layout'] }.to(true))
    expect(page)
      .to have_title(I18n.t('settings.appearance'))
  end

  def custom_css_field
    form_label 'form_admin_settings.custom_css'
  end
end
