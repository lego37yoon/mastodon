# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReactService do
  subject { described_class.new }

  let(:account) { Fabricate(:account) }
  let(:status) { Fabricate(:status) }

  describe '#call' do
    it 'rejects remote custom emoji identifiers for local reactions' do
      expect { subject.call(account, status, 'blobcat@example.com') }
        .to raise_error(Mastodon::NotPermittedError)
    end
  end
end
