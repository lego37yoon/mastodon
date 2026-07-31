# frozen_string_literal: true

require 'rails_helper'
require Rails.root.join('db', 'migrate', '20260712000000_migrate_smore_themes')

RSpec.describe MigrateSmoreThemes do
  subject(:migration) { described_class.new }

  describe '#up' do
    it 'converts every legacy theme into independent theme preferences' do
      expected_settings = {
        'ridibatang-light' => %w(ridibatang light auto),
        'ridibatang-dark' => %w(ridibatang dark auto),
        'maruburi-light' => %w(maruburi light auto),
        'maruburi-dark' => %w(maruburi dark auto),
        'mastodon-light' => %w(default light auto),
        'contrast' => %w(default dark high),
      }
      users = expected_settings.to_h do |legacy_theme, _expected|
        user = Fabricate(:user)
        user.settings.update('theme' => legacy_theme, 'noindex' => false)
        user.save!
        [legacy_theme, user]
      end

      migration.up

      expected_settings.each do |legacy_theme, (theme, color_scheme, contrast)|
        settings = JSON.parse(users.fetch(legacy_theme).reload.attributes_before_type_cast['settings'])
        expect(settings).to include(
          'theme' => theme,
          'web.color_scheme' => color_scheme,
          'web.contrast' => contrast,
          'noindex' => false
        )
      end
    end

    it 'preserves users with themes that do not need migration' do
      themes = %w(system default smore ridibatang maruburi)
      original_settings = themes.index_with do |theme|
        {
          'theme' => theme,
          'web.color_scheme' => 'auto',
          'web.contrast' => 'auto',
          'noindex' => true,
        }
      end
      users = original_settings.to_h do |theme, settings|
        user = Fabricate(:user)
        user.settings.update(settings)
        user.save!
        [theme, user]
      end

      migration.up

      users.each do |theme, user|
        settings = JSON.parse(user.reload.attributes_before_type_cast['settings'])
        expect(settings).to eq original_settings.fetch(theme)
      end
    end

    it 'converts every persisted legacy site theme' do
      expected_themes = {
        'ridibatang-light' => 'ridibatang',
        'ridibatang-dark' => 'ridibatang',
        'maruburi-light' => 'maruburi',
        'maruburi-dark' => 'maruburi',
        'mastodon-light' => 'default',
        'contrast' => 'default',
      }
      setting = described_class::Setting.find_or_create_by!(var: 'theme')

      expected_themes.each do |legacy_theme, expected_theme|
        setting.update_column(:value, legacy_theme.to_yaml)

        migration.up

        expect(YAML.safe_load(setting.reload.attributes['value'])).to eq expected_theme
      end
    end

    it 'preserves site themes that do not need migration' do
      themes = %w(default smore ridibatang maruburi) + ['', nil]
      setting = described_class::Setting.find_or_create_by!(var: 'theme')

      themes.each do |theme|
        original_value = theme&.to_yaml
        setting.update_column(:value, original_value)

        migration.up

        expect(setting.reload.attributes['value']).to eq original_value
      end
    end

    it 'does not create a missing site theme setting' do
      described_class::Setting.where(var: 'theme').delete_all

      expect { migration.up }.to_not(change { described_class::Setting.exists?(var: 'theme') })
    end
  end
end
