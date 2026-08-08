# frozen_string_literal: true

require 'rails_helper'

RSpec.describe REST::ReactionSerializer do
  subject { serialized_record_json(reaction, described_class, options: { scope: reactor_a, scope_name: :current_user }) }

  let(:status) { Fabricate(:status, account: Fabricate(:account, username: 'status_author')) }
  let(:reactor_a) { Fabricate(:account, username: 'alice', display_name: 'Alice Reacts') }
  let(:reactor_b) { Fabricate(:account, username: 'bob', display_name: 'Bob Reacts') }
  let(:reaction) do
    status.status_reactions.create!(account: reactor_a, name: '👍')
    status.status_reactions.create!(account: reactor_b, name: '👍')
    status.reactions.first
  end

  it 'includes full reacted_by list for the reaction' do
    expect(subject['reacted_by']).to contain_exactly(hash_including(
                                                       'id' => reactor_a.id.to_s,
                                                       'display_name' => reactor_a.display_name
                                                     ), hash_including(
                                                          'id' => reactor_b.id.to_s,
                                                          'display_name' => reactor_b.display_name
                                                        ))
  end
end
