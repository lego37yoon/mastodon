# frozen_string_literal: true

class AddIsCatToAccounts < ActiveRecord::Migration[8.0]
  def change
    add_column :accounts, :is_cat, :boolean, default: false, null: false
  end
end
