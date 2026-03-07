import { v4 as uuidv4 } from "uuid";
import type { TemplateTopic } from "../types/survey-template.types";

type TemplateOption = { Value: string; Text: string };

export const ensureSelectedTemplateOption = (
  options: TemplateOption[],
  templateId?: string,
  templateTitle?: string,
): TemplateOption[] => {
  if (!templateId || !templateTitle) {
    return options;
  }

  if (options.some((x) => x.Value === templateId)) {
    return options;
  }

  return [...options, { Value: templateId, Text: templateTitle }];
};

export const remapTemplateTopicIdsForCampaign = (
  topics: TemplateTopic[],
): TemplateTopic[] => {
  return topics.map((topic) => {
    const nextTopicId = uuidv4();

    const nextCategories = topic.ListCategory.map((category) => {
      const nextCategoryId = uuidv4();

      return {
        ...category,
        Id: nextCategoryId,
        TopicId: nextTopicId,
        ListQuestion: category.ListQuestion.map((question) => ({
          ...question,
          Id: uuidv4(),
          CategoryId: nextCategoryId,
        })),
      };
    });

    return {
      ...topic,
      Id: nextTopicId,
      ListCategory: nextCategories,
      ListTextQuestion: topic.ListTextQuestion.map((textQuestion) => ({
        ...textQuestion,
        Id: uuidv4(),
        TopicId: nextTopicId,
      })),
    };
  });
};
