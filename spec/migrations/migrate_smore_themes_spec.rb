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
        user.update_column(:settings, JSON.generate('theme' => legacy_theme, 'noindex' => false))
        [legacy_theme, user]
      end

      migration.up

      expected_settings.each do |legacy_theme, (theme, color_scheme, contrast)|
        settings = JSON.parse(users.fetch(legacy_theme).reload.attributes_before_type_cast['settings'])
        expect(settings).to include(
          'theme' => theme,
          'web.color_scheme' => color_scheme,
          'web.contrast' => contrast
        )
      end
    end

    it 'converts a persisted legacy site theme' do
      setting = described_class::Setting.find_or_create_by!(var: 'theme')
      setting.update_column(:value, 'maruburi-light'.to_yaml)

      migration.up

      migrated_setting = described_class::Setting.find_by(var: 'theme')
      expect(YAML.safe_load(migrated_setting.attributes['value'])).to eq 'maruburi'
    end
  end
end
