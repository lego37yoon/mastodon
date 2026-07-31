# frozen_string_literal: true

# Original code by syuilo and misskey-project (https://github.com/misskey-dev/misskey)
# Commit Hash at Source: 2cbe1d1, File path: packages/misskey-js/src/nyaize.ts
# Licensed under AGPL-3.0-only

module CatHelper
  def nyaify(text)
    return text if text.blank?

    text = text.to_s
    entities = Extractor.extract_urls_with_indices(text, extract_url_without_protocol: false)
      .concat(Extractor.extract_hashtags_with_indices(text))

    return nyaify_text(text) if entities.empty?

    tokenized_text = +''
    last_index = 0
    tokens = {}

    entities.sort_by! { |entity| entity[:indices].first }

    entities.each_with_index do |entity, index|
      start_index, end_index = entity[:indices]
      token = "__NYA_PRESERVE_TOKEN_#{index}__"

      tokenized_text << text[last_index...start_index]
      tokenized_text << token
      tokens[token] = text[start_index...end_index]
      last_index = end_index
    end

    tokenized_text << text[last_index..]

    tokens.reduce(nyaify_text(tokenized_text)) do |memo, (token, raw_segment)|
      memo.gsub(token, raw_segment)
    end
  end

  private

  def nyaify_text(text)
    # ja-JP
    text.gsub!('な', 'にゃ')
    text.gsub!('ナ', 'ニャ')
    text.gsub!('ﾅ', 'ﾆｬ')

    # en-US
    text.gsub!(/(?<=n)a/i) { |m| m == 'A' ? 'YA' : 'ya' }
    text.gsub!(/(?<=morn)ing/i) { |m| m == 'ING' ? 'YAN' : 'yan' }
    text.gsub!(/(?<=every)one/i) { |m| m == 'ONE' ? 'NYAN' : 'nyan' }

    # ko-KR
    # Shift [나-낳] to [냐-냫]
    # '냐'.ord - '나'.ord = 56
    text.gsub!(/[나-낳]/) { |m| (m.ord + 56).chr(Encoding::UTF_8) }

    text.gsub!(/(다$)|(다(?=\.))|(다(?= ))|(다(?=!))|(다(?=\?))/, '다냥')
    text.gsub!(/(야(?=\?))|(야$)|(야(?= ))/, '냥')

    text
  end
end
