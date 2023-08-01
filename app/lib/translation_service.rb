# frozen_string_literal: true

class TranslationService
  class Error < StandardError; end
  class NotConfiguredError < Error; end
  class TooManyRequestsError < Error; end
  class QuotaExceededError < Error; end
  class UnexpectedResponseError < Error; end
  class RequestNotValidError < Error; end
  class TranslationServerError < Error; end

  def self.configured
    if ENV['DEEPL_API_KEY'].present?
      TranslationService::DeepL.new(ENV.fetch('DEEPL_PLAN', 'free'), ENV['DEEPL_API_KEY'])
    elsif ENV['PAPAGO_API_ID'].present?
      TranslationService::Papago.new(ENV['PAPAGO_API_ID'], ENV['PAPAGO_API_SECRET'])
    elsif ENV['LIBRE_TRANSLATE_ENDPOINT'].present?
      TranslationService::LibreTranslate.new(ENV['LIBRE_TRANSLATE_ENDPOINT'], ENV['LIBRE_TRANSLATE_API_KEY'])
    else
      raise NotConfiguredError
    end
  end

  def self.configured?
    ENV['DEEPL_API_KEY'].present? || ENV['PAPAGO_API_ID'].present? || ENV['LIBRE_TRANSLATE_ENDPOINT'].present?
  end

  def translate(_text, _source_language, _target_language)
    raise NotImplementedError
  end
end
