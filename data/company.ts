type CompanyData = Company[];

type Company = {
  name: string;
  businessId: string;
  summary: string;
  categories: Rating[];
};

type Rating = {
  categoryId: number;
  summary: string;
  score: number;
  sources: Source[];
};

type Source = {
  url: string,
  title: string,
};
